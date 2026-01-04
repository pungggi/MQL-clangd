'use strict';
const vscode = require('vscode');
const fs = require('fs');
const pathModule = require('path');
const ext = require("./extension");

// Helper to normalize paths for clangd (forward slashes and handle spaces)
// Clangd is picky about backslashes in flag arguments on Windows.
function normalizePath(p) {
    if (!p) return p;
    return p.replace(/\\/g, '/');
}

// Helper to merge flags without duplicates to avoid polluting settings
function mergeFlags(currentFlags, newFlags) {
    const combined = [...currentFlags];
    for (const flag of newFlags) {
        if (!combined.includes(flag)) {
            combined.push(flag);
        }
    }
    return combined;
}

/**
 * Main function to generate/update workspace properties for clangd.
 * Configures include paths, compiler flags, and basic file behaviors.
 */
function CreateProperties() {
    // Safety check: Ensure we are in a workspace
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return vscode.window.showErrorMessage(ext.lg['err_no_workspace'] || 'Please open a workspace folder first.');
    }

    const config = vscode.workspace.getConfiguration();
    const configMql = vscode.workspace.getConfiguration('mql_tools');
    
    // Support multi-root: identify the context (active document or first folder)
    const editor = vscode.window.activeTextEditor;
    const workspaceFolder = (editor && vscode.workspace.getWorkspaceFolder(editor.document.uri)) 
                            ? vscode.workspace.getWorkspaceFolder(editor.document.uri) 
                            : vscode.workspace.workspaceFolders[0];
    
    const workspacepath = workspaceFolder.uri.fsPath;
    const workspaceName = workspaceFolder.name;
    
    const incPath = pathModule.join(workspacepath, 'Include');
    
    // Base flags for clangd to improve MQL support.
    // -xc++: Force clangd to treat files as C++
    // -std=c++17: Modern standard to cover MQL features
    // -Wno-*: Disable common noisy warnings in MQL code
    const baseFlags = [
        '-xc++',
        '-std=c++17',
        '-D__MQL__',
        '-D__MQL5__', // Default to 5
        '-Wno-invalid-token-paste',
        '-Wno-unused-value',
        `-I${normalizePath(workspacepath)}`,
        `-I${normalizePath(incPath)}`
    ];

    let incDir, CommI;

    // Detect MQL version (4 vs 5) based on path/name for specialized defines
    if (workspaceName.toUpperCase().includes('MQL4') || workspacepath.toUpperCase().includes('MQL4')) {
        incDir = configMql.Metaeditor.Include4Dir;
        CommI = ext.lg['path_include_4'];
        const mql5Idx = baseFlags.indexOf('-D__MQL5__');
        if (mql5Idx !== -1) baseFlags[mql5Idx] = '-D__MQL4__';
    } else {
        incDir = configMql.Metaeditor.Include5Dir;
        CommI = ext.lg['path_include_5'];
    }

    const arrPath = [...baseFlags];

    // Handle external Include directory (from MetaTrader installation)
    if (incDir && incDir.length > 0) {
        if (!fs.existsSync(incDir)) {
            vscode.window.showErrorMessage(`${CommI} [ ${incDir} ]`);
        } else {
            const externalIncDir = pathModule.join(incDir, 'Include');
            if (fs.existsSync(externalIncDir)) {
                arrPath.push(`-I${normalizePath(externalIncDir)}`);
            } else {
                arrPath.push(`-I${normalizePath(incDir)}`);
            }
        }
    }

    // Update clangd.fallbackFlags (Merging to preserve user customizations)
    const existingFlags = config.get('clangd.fallbackFlags') || [];
    const mergedFlags = mergeFlags(existingFlags, arrPath);
    config.update('clangd.fallbackFlags', mergedFlags, false);

    // CRITICAL: Disable C_Cpp IntelliSense to avoid duplicate errors/suggestions
    config.update('C_Cpp.intelliSenseEngine', 'Disabled', false);

    const object = {
        '**/*.ex4': true,
        '**/*.ex5': true,
    };

    const obj_token = {
        textMateRules: [
            { scope: 'token.error.mql', settings: { foreground: '#F44747' } },
            { scope: 'token.done.mql', settings: { foreground: '#029c23d3' } },
            { scope: 'token.warning.mql', settings: { foreground: '#ff9d00' } },
            { scope: 'token.info.mql', settings: { foreground: '#0861fc' } },
            { scope: 'token.heading.mql', settings: { foreground: '#6796E6' } },
        ],
    };

    const obj_associations = {
        '*.mqh': 'cpp',
        '*.mq4': 'cpp',
        '*.mq5': 'cpp'
    };

    config.update('mql_tools.context', true, false);
    config.update('editor.tokenColorCustomizations', obj_token, false);
    config.update('files.exclude', object, false);
    config.update('files.associations', obj_associations, false);
}

/**
 * Secondary helper to update properties during compilation or file system changes.
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
    
    const baseFlags = [
        '-xc++',
        '-std=c++17',
        `-I${normalizePath(workspacepath)}`,
        `-I${normalizePath(incPath)}`
    ];

    const normalizedIncDir = normalizePath(pathModule.join(incDir, 'Include'));
    const arrPath = [...baseFlags, `-I${normalizedIncDir}`];

    const existingFlags = config.get('clangd.fallbackFlags') || [];
    const mergedFlags = mergeFlags(existingFlags, arrPath);
    config.update('clangd.fallbackFlags', mergedFlags, false);
    
    // Ensure Fighting is stopped
    config.update('C_Cpp.intelliSenseEngine', 'Disabled', false);
}


module.exports = {
    CreateProperties,
    Cpp_prop
}