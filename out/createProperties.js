'use strict';
const vscode = require('vscode');
const fs = require('fs');
const pathModule = require('path');

/**
 * Normalizes paths for clangd (forward slashes).
 * @param {string} p 
 */
function normalizePath(p) {
    if (!p) return '';
    return p.replace(/\\/g, '/');
}

/**
 * Merges new flags into existing ones, avoiding duplicates and empty strings.
 * @param {string[]} currentFlags 
 * @param {string[]} newFlags 
 */
function mergeFlags(currentFlags, newFlags) {
    const combined = Array.isArray(currentFlags) ? [...currentFlags] : [];
    const sanitizedNew = newFlags.filter(f => f && typeof f === 'string' && f.trim().length > 0);
    for (const flag of sanitizedNew) {
        if (!combined.includes(flag)) {
            combined.push(flag);
        }
    }
    return combined;
}

/**
 * Safely updates VS Code configuration to avoid errors if settings are not registered.
 * @param {string} section - The configuration section to update
 * @param {any} value - The value to set
 * @param {vscode.ConfigurationTarget} target - The configuration target
 * @param {boolean} [silent=false] - If true, don't log anything on failure
 */
async function safeConfigUpdate(section, value, target, silent = false) {
    const config = vscode.workspace.getConfiguration();
    const info = config.inspect(section);

    // Only attempt update if the setting exists/is registered
    if (info) {
        try {
            await config.update(section, value, target);
        } catch (e) {
            // Only log if not in silent mode - some settings are expected to fail
            if (!silent) {
                console.info(`MQL Tools: Optional setting ${section} not updated.`);
            }
        }
    }
}

/**
 * Main function to generate/update workspace properties for clangd.
 */
async function CreateProperties() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return;
    }

    const config = vscode.workspace.getConfiguration();
    const configMql = vscode.workspace.getConfiguration('mql_tools');
    const language = vscode.env.language;

    let lg;
    try {
        lg = require(`../landes.${language}.json`);
    } catch (e) {
        lg = require('../landes.json');
    }

    const editor = vscode.window.activeTextEditor;
    const workspaceFolder = (editor && vscode.workspace.getWorkspaceFolder(editor.document.uri))
        ? vscode.workspace.getWorkspaceFolder(editor.document.uri)
        : vscode.workspace.workspaceFolders[0];

    const workspacepath = workspaceFolder.uri.fsPath;
    const workspaceName = workspaceFolder.name;
    const incPath = pathModule.join(workspacepath, 'Include');

    // Path to MQL compatibility header for clangd
    const extensionPath = pathModule.join(__dirname, '..');
    const compatHeaderPath = normalizePath(pathModule.join(extensionPath, 'files', 'mql_clangd_compat.h'));

    // Base flags for clangd to improve MQL support.
    const baseFlags = [
        '-xc++',
        '-std=c++17',
        '-D__MQL__',
        '-D__MQL5__',
        `-include${compatHeaderPath}`,
        '-fms-extensions',           // Allow some non-standard C++ (like incomplete arrays)
        '-fms-compatibility',
        '-ferror-limit=0',           // Don't stop at 20 errors
        '-Wno-invalid-token-paste',
        '-Wno-unused-value',
        '-Wno-unknown-pragmas',
        '-Wno-writable-strings',     // Silences string literal to char* warnings
        '-Xclang', '-Wno-invalid-pp-directive', // Force silence #property errors
        '-Wno-unknown-directives',
        '-Wno-language-extension-token',
        `-I${normalizePath(workspacepath)}`,
        `-I${normalizePath(incPath)}`
    ];

    let incDir, CommI;
    if (workspaceName.toUpperCase().includes('MQL4') || workspacepath.toUpperCase().includes('MQL4')) {
        incDir = configMql.Metaeditor.Include4Dir;
        CommI = lg['path_include_4'] || 'Include path';
        const mql5Idx = baseFlags.indexOf('-D__MQL5__');
        if (mql5Idx !== -1) baseFlags[mql5Idx] = '-D__MQL4__';
    } else {
        incDir = configMql.Metaeditor.Include5Dir;
        CommI = lg['path_include_5'] || 'Include path';
    }

    const arrPath = [...baseFlags];
    if (incDir && incDir.length > 0) {
        const externalIncDir = pathModule.join(incDir, 'Include');
        if (fs.existsSync(externalIncDir)) {
            arrPath.push(`-I${normalizePath(externalIncDir)}`);
        } else if (fs.existsSync(incDir)) {
            arrPath.push(`-I${normalizePath(incDir)}`);
        }
    }


    // Update fallback flags
    const existingFlags = config.get('clangd.fallbackFlags') || [];
    const mergedFlags = mergeFlags(existingFlags, arrPath);
    await safeConfigUpdate('clangd.fallbackFlags', mergedFlags, vscode.ConfigurationTarget.Workspace);
    // C_Cpp.intelliSenseEngine is optional - silent mode since C++ extension may not be installed
    await safeConfigUpdate('C_Cpp.intelliSenseEngine', 'Disabled', vscode.ConfigurationTarget.Workspace, true);

    // --- Generate compile_commands.json ---
    try {
        const targetFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, '**/*.{mq4,mq5,mqh}'));
        const compileCommands = targetFiles.map(fileUri => {
            const filePath = normalizePath(fileUri.fsPath);
            const args = ['clang++'];
            arrPath.forEach(flag => { if (flag) args.push(flag); });
            args.push(filePath);

            return {
                directory: normalizePath(workspacepath),
                arguments: args,
                file: filePath
            };
        });

        if (compileCommands.length > 0) {
            const dbPath = pathModule.join(workspacepath, 'compile_commands.json');
            await fs.promises.writeFile(dbPath, JSON.stringify(compileCommands, null, 4), 'utf8');

            // Cleanup conflicting files
            const legacyFlags = pathModule.join(workspacepath, 'compile_flags.txt');
            if (fs.existsSync(legacyFlags)) {
                await fs.promises.unlink(legacyFlags).catch(() => { });
            }
        }
    } catch (err) {
        console.error('MQL Tools: Failed to generate compile_commands.json', err);
    }

    const associations = { '*.mqh': 'cpp', '*.mq4': 'cpp', '*.mq5': 'cpp' };
    await safeConfigUpdate('mql_tools.context', true, vscode.ConfigurationTarget.Workspace);
    await safeConfigUpdate('files.associations', associations, vscode.ConfigurationTarget.Workspace);

    // --- Generate .clangd file for direct diagnostic suppression ---
    try {
        const clangdConfigPath = pathModule.join(workspacepath, '.clangd');
        const clangdConfig =
            `# MQL Clangd Configuration
# Auto-generated by MQL Clangd extension
# This file suppresses false-positive errors from clangd for MQL-specific syntax

Diagnostics:
  Suppress:
    # Preprocessor directives (MQL uses #property, #import, etc.)
    - pp_invalid_directive
    - unknown_directive
    - pp_import_directive_ms

    # Array handling (MQL allows incomplete arrays as parameters)
    - typecheck_incomplete_array_needs_initializer
    - illegal_decl_array_of_references
    - typecheck_subscript_not_integer

    # Type conversion (MQL is more permissive with implicit conversions)
    - typecheck_invalid_operands
    - typecheck_convert_incompatible_pointer
    - init_conversion_failed
    - reference_bind_drops_quals
    - lvalue_reference_bind_to_temporary
    - err_lvalue_reference_bind_to_unrelated

    # Overload resolution (MQL has different overload rules)
    - ovl_no_conversion_in_cast
    - ovl_no_viable_conversion_in_cast
    - ovl_no_viable_function_in_call
    - ovl_no_viable_function_in_init
    - ovl_diff_return_type
    - ovl_ambiguous_call
    - ovl_ambiguous_conversion
    - ovl_ambiguous_conversion_in_cast
    - ovl_ambiguous_oper_binary
    - ovl_ambiguous_oper_unary
    - ambig_derived_to_base_conv

    # Variable/function declarations
    - undeclared_var_use
    - undeclared_var_use_suggest
    - redefinition
    - param_default_argument_redefinition

    # MQL-specific patterns
    - non-pod-varargs
    - duplicate_case
    - writable-strings
    - conditional_ambiguous
    - err_typecheck_member_reference_suggestion
    - err_field_incomplete_or_sizeless
    - err_typecheck_bool_condition
    - err_typecheck_ambiguous_condition
    - tautological-constant-out-of-range-compare

    # MQL 'this' keyword usage (MQL allows 'this.' without pointer syntax)
    - err_member_reference_needs_call
    - member_reference_needs_call

  ClangTidy:
    Remove:
      - modernize-*
      - cppcoreguidelines-*
      - readability-identifier-naming
      - bugprone-narrowing-conversions
      - cert-*
      - hicpp-*
      - performance-*
      - google-*

CompileFlags:
  Add:
    # Suppress all warnings in .clangd config; targeted -Wno-* flags are already set in baseFlags
    - -Wno-everything
`;
        await fs.promises.writeFile(clangdConfigPath, clangdConfig, 'utf8');
    } catch (err) {
        console.error('MQL Tools: Failed to generate .clangd', err);
    }
}

/**
 * Secondary helper to update properties during compilation.
 */
function Cpp_prop(incDir) {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) return;

    const config = vscode.workspace.getConfiguration();
    const editor = vscode.window.activeTextEditor;
    const workspaceFolder = (editor && vscode.workspace.getWorkspaceFolder(editor.document.uri))
        ? vscode.workspace.getWorkspaceFolder(editor.document.uri)
        : vscode.workspace.workspaceFolders[0];

    const workspacepath = workspaceFolder.uri.fsPath;
    const incPath = pathModule.join(workspacepath, 'Include');

    const extensionPath = pathModule.join(__dirname, '..');
    const compatHeaderPath = normalizePath(pathModule.join(extensionPath, 'files', 'mql_clangd_compat.h'));

    const baseFlags = [
        '-xc++',
        '-std=c++17',
        `-include${compatHeaderPath}`,
        '-fms-extensions',
        '-fms-compatibility',
        '-ferror-limit=0',
        '-Wno-unknown-pragmas',
        '-Wno-writable-strings',
        '-Xclang', '-Wno-invalid-pp-directive',
        '-Wno-unknown-directives',
        `-I${normalizePath(workspacepath)}`,
        `-I${normalizePath(incPath)}`
    ];

    const normalizedIncDir = normalizePath(pathModule.join(incDir, 'Include'));
    const arrPath = [...baseFlags, `-I${normalizedIncDir}`];

    const existingFlags = config.get('clangd.fallbackFlags') || [];
    const mergedFlags = mergeFlags(existingFlags, arrPath);
    safeConfigUpdate('clangd.fallbackFlags', mergedFlags, vscode.ConfigurationTarget.Workspace);
    // C_Cpp.intelliSenseEngine is optional - silent mode since C++ extension may not be installed
    safeConfigUpdate('C_Cpp.intelliSenseEngine', 'Disabled', vscode.ConfigurationTarget.Workspace, true);
}

module.exports = {
    CreateProperties,
    Cpp_prop,
    normalizePath
};
