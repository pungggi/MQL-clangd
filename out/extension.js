'use strict';
const url = require('url');
const vscode = require('vscode');
const childProcess = require('child_process');
const fs = require('fs');
const pathModule = require('path');
const sleep = require('util').promisify(setTimeout);
const fsPromises = fs.promises;

const REG_COMPILING = /: information: (?:compiling|checking)/;
const REG_INCLUDE = /: information: including/;
const REG_INFO = /: information: info/;
const REG_RESULT = /(?:Result:|: information: result)/;
const REG_ERR_WAR = /(?!0)\d+.(?:error|warning)/;
const REG_RESULT_SHORT = /\d+.error.+/;
const REG_LINE_PATH = /([a-zA-Z]:\\.+(?= :)|^\(\d+,\d+\))(?:.: )(.+)/;
const REG_ERROR_CODE = /(?<=error |warning )\d+/;
const REG_FULL_PATH = /[a-z]:\\.+/gi;
const REG_LINE_POS = /\((?:\d+\,\d+)\)$/gm;
const REG_LINE_FRAGMENT = /\((?=(\d+,\d+).$)/gm;
const language = vscode.env.language;

const diagnosticCollection = vscode.languages.createDiagnosticCollection('mql');
const { Help } = require("./help");
const { ShowFiles, InsertNameFileMQH, InsertMQH, InsertNameFileMQL, InsertMQL, InsertResource, InsertImport, InsertTime, InsertIcon, OpenFileInMetaEditor, CreateComment } = require("./contextMenu");
const { IconsInstallation } = require("./addIcon");
const { Hover_log, DefinitionProvider, Hover_MQL, ItemProvider, HelpProvider, ColorProvider } = require("./provider");
const { Cpp_prop, CreateProperties } = require("./createProperties");
const outputChannel = vscode.window.createOutputChannel('MQL', 'mql-output');


try {
    var lg = require(`../landes.${language}.json`);
}
catch (error) {
    lg = require('../landes.json');
}


function Compile(rt) {
    FixFormatting();
    vscode.commands.executeCommand('workbench.action.files.saveAll');
    const NameFileMQL = rt != 0 ? FindParentFile() : '',
        path = NameFileMQL != undefined ? (fs.existsSync(NameFileMQL) ? NameFileMQL : vscode.window.activeTextEditor.document.fileName) : vscode.window.activeTextEditor.document.fileName,
        config = vscode.workspace.getConfiguration('mql_tools'),
        fileName = pathModule.basename(path),
        extension = pathModule.extname(path).toLowerCase(),
        PathScript = pathModule.join(__dirname, '../', 'files', 'MQL Tools_Compiler.exe'),
        logDir = config.LogFile.NameLog, Timemini = config.Script.Timetomini,
        mme = config.Script.MiniME, cme = config.Script.CloseME,
        wn = vscode.workspace.name.includes('MQL4'), startT = new Date(),
        time = `${tf(startT, 'h')}:${tf(startT, 'm')}:${tf(startT, 's')}`;

    let logFile, command, MetaDir, incDir, CommM, CommI, teq, includefile, log;

    if (extension === '.mq4' || (extension === '.mqh' && wn && rt === 0)) {
        MetaDir = config.Metaeditor.Metaeditor4Dir;
        incDir = config.Metaeditor.Include4Dir;
        CommM = lg['path_editor4'];
        CommI = lg['path_include_4'];
    } else if (extension === '.mq5' || (extension === '.mqh' && !wn && rt === 0)) {
        MetaDir = config.Metaeditor.Metaeditor5Dir;
        incDir = config.Metaeditor.Include5Dir;
        CommM = lg['path_editor5'];
        CommI = lg['path_include_5'];
    } else if (extension === '.mqh' && rt !== 0) {
        return vscode.window.showWarningMessage(lg['mqh']);
    } else {
        return undefined;
    }

    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Window,
            title: `MQL Tools: ${rt === 0 ? lg['checking'] : lg['compiling']}`,
        },
        () => {
            return new Promise((resolve) => {

                switch (rt) {
                    case 0: teq = lg['checking'];
                        break;
                    case 1: teq = lg['compiling'];
                        break;
                    case 2: teq = lg['comp_usi_script'];
                        break;
                }

                outputChannel.clear();
                outputChannel.show(true);
                outputChannel.appendLine(`[Starting] [${time}] ${teq} >>> ${fileName} <<<`);

                const Nm = pathModule.basename(MetaDir), Pm = pathModule.dirname(MetaDir),
                    lowNm = Nm.toLowerCase();

                if (!(fs.existsSync(Pm) && (lowNm === 'metaeditor.exe' || lowNm === 'metaeditor64.exe'))) {
                    return resolve(), outputChannel.appendLine(`[Error]  '${CommM}' [ ${MetaDir} ]`);
                }

                if (incDir.length) {
                    if (!fs.existsSync(incDir)) {
                        return resolve(), outputChannel.appendLine(`[Error]  ${CommI} [ ${incDir} ]`);
                    } else {
                        includefile = ` /include:"${incDir}"`;
                        Cpp_prop(incDir);
                    }
                } else {
                    includefile = '';
                }

                if (logDir.length) {
                    if (pathModule.extname(logDir) === '.log') {
                        logFile = path.replace(fileName, logDir);
                    } else {
                        logFile = path.replace(fileName, logDir + '.log');
                    }
                } else {
                    logFile = path.replace(fileName, (fileName.match(/.+(?=\.)/) || [fileName])[0] + '.log');
                }

                command = `"${MetaDir}" /compile:"${path}"${includefile}${rt === 1 || (rt === 2 && cme) ? '' : ' /s'} /log:"${logFile}"`;

                childProcess.exec(command, async (err, stdout, stderror) => {

                    if (stderror) {
                        return resolve(), outputChannel.appendLine(`[Error]  ${lg['editor64']} ${CommM} [${MetaDir}] \n[Warning] ${lg['editor64to']} [${Pm}\\${(Nm === 'metaeditor.exe' ? 'metaeditor64.exe' : 'metaeditor.exe')}]`);
                    }

                    try {
                        var data = await fsPromises.readFile(logFile, 'ucs-2');
                    } catch (err) {
                        return vscode.window.showErrorMessage(`${lg['err_read_log']} ${err}`), resolve();
                    }

                    config.LogFile.DeleteLog && fs.unlink(logFile, (err) => {
                        err && vscode.window.showErrorMessage(lg['err_remove_log']);
                    });

                    switch (rt) {
                        case 0: log = replaceLog(data, false); outputChannel.appendLine(String(log.text)); break;
                        case 1: log = replaceLog(data, true); outputChannel.appendLine(String(log.text)); break;
                        case 2: log = cme ? replaceLog(data, true) : replaceLog(data, false); break; // Output handled below
                    }

                    // Update Diagnostics
                    if (log && log.diagnostics) {
                        diagnosticCollection.clear();
                        const diagsByFile = {};
                        log.diagnostics.forEach(d => {
                            if (!diagsByFile[d.file]) diagsByFile[d.file] = [];
                            diagsByFile[d.file].push(new vscode.Diagnostic(d.range, d.message, d.severity));
                        });
                        for (const file in diagsByFile) {
                            diagnosticCollection.set(vscode.Uri.file(file), diagsByFile[file]);
                        }
                    }

                    const end = new Date;

                    if (rt === 2 && !log.error) {
                        let TimeClose = (Math.ceil((end - startT) * 0.01) * 100);
                        command = `"${PathScript}" "${MetaDir}" "${path}" ${mme ? 1 : 0} ${Timemini} ${cme ? 1 : 0} ${TimeClose} ${Nm}`;

                        childProcess.exec(command, (error) => {
                            if (error) {
                                outputChannel.appendLine(`[Error]  ${lg['err_start_script']}`);
                                return resolve();
                            }
                            outputChannel.appendLine(String(cme ? log.text : log.text + lg['info_log_compile']));
                            resolve();
                        });
                    } else if (rt === 2 && log.error) {
                        outputChannel.appendLine(log.text);
                        resolve();
                    } else {
                        resolve();
                    }
                });
                sleep(30000).then(() => { resolve(); });
            });
        }
    );
}

function replaceLog(str, f) {
    let text = f ? '' : '\n\n', obj_hover = {}, ye = false, diagnostics = [];
    if (!str) return { text, obj_hover, error: ye, diagnostics };

    const lines = str.replace(/\u{FEFF}/gu, '').split('\n');
    for (const item of lines) {
        const trimmed = item.trim();
        if (!trimmed) continue;

        if (REG_COMPILING.test(item)) {
            const isCompiling = item.includes('compiling');
            const regEx = new RegExp(`(?<=${isCompiling ? 'compiling' : 'checking'}.).+'`, 'gi');
            const mName = item.match(regEx);
            const mPath = item.match(/[a-zA-Z]:\\.+(?= :)/gi);

            if (mName && mPath) {
                const name = mName[0];
                const link = url.pathToFileURL(mPath[0]).href;
                obj_hover[name] = { link };
                text += name + '\n';
            }
        }
        else if (REG_INCLUDE.test(item)) {
            const mName = item.match(/(?<=information: including ).+'/gi);
            const mPath = item.match(/[a-zA-Z]:\\.+(?= :)/gi);
            if (mName && mPath) {
                const name = mName[0];
                const link = url.pathToFileURL(mPath[0]).href;
                obj_hover[name] = { link };
                text += name + '\n';
            }
        }
        else if (item.includes('information: generating code') || item.includes('information: code generated')) {
            continue;
        }
        else if (REG_INFO.test(item)) {
            const mName = item.match(/(?<=information: ).+/gi);
            const mPath = item.match(/[a-zA-Z]:\\.+(?= :)/gi);
            if (mName && mPath) {
                const name = mName[0];
                const link = url.pathToFileURL(mPath[0]).href;
                obj_hover[name] = { link };
                text += name + '\n';
            }
        }
        else if (REG_RESULT.test(item)) {
            const mErrWar = item.match(REG_ERR_WAR);
            const mSummary = item.match(REG_RESULT_SHORT);
            const summaryText = mSummary ? mSummary[0] : item;

            if (mErrWar) {
                const isErr = mErrWar[0].includes('error');
                if (isErr) ye = true;
                text += f ? `[${isErr ? 'Error' : 'Warning'}] ${item}` : `[${isErr ? 'Error' : 'Warning'}] Result: ${summaryText}`;
            } else {
                text += f ? `[Done] ${item}` : `[Done] Result: ${summaryText}`;
            }
            text += '\n';
        }
        else {
            const mLinePath = item.match(REG_LINE_PATH);
            if (mLinePath) {
                const link_res = (mLinePath[1] || '').replace(/[\r\n]+/g, '');
                let name_res = (mLinePath[2] || '').replace(/[\r\n]+/g, '');

                const gh_match = name_res.match(REG_ERROR_CODE);
                const gh = gh_match ? gh_match[0] : null;
                name_res = name_res.replace(gh || '', '').replace(/^(error|warning)\s*:\s*/i, '').trim();

                if (link_res.match(REG_FULL_PATH) && name_res) {
                    const mFullPath = link_res.match(/[a-zA-Z]:\\[^(\r\n]+/g);
                    const mPos = link_res.match(/\((\d+),(\d+)\)$/);

                    if (mFullPath && mPos) {
                        const fullPath = mFullPath[0].replace(/\($/, '').trim();
                        const line = parseInt(mPos[1]) - 1;
                        const col = parseInt(mPos[2]) - 1;
                        const severity = item.toLowerCase().includes('error') ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;

                        if (severity === vscode.DiagnosticSeverity.Error) ye = true;

                        diagnostics.push({
                            file: fullPath,
                            range: new vscode.Range(line, col, line, col + 1),
                            message: name_res,
                            severity: severity
                        });

                        const linePos = link_res.match(REG_LINE_POS);
                        const hoverKey = (name_res + ' ' + (linePos ? linePos[0] : '')).trim();
                        obj_hover[hoverKey] = {
                            link: url.pathToFileURL(link_res).href.replace(REG_LINE_FRAGMENT, '#').replace(/\)$/gm, ''),
                            number: gh ? String(gh) : null
                        };

                        const suffix = link_res.match(/(.)(?:\d+,\d+).$/gm);
                        text += name_res + (suffix ? ' ' + suffix[0] : '') + '\n';
                    } else {
                        text += name_res + '\n';
                    }
                }
                else {
                    text += name_res + (gh ? ` ${gh}` : '') + '\n';
                }
            } else {
                text += item + '\n';
            }
        }
    }

    exports.obj_hover = obj_hover;
    return {
        text: text,
        error: ye,
        diagnostics: diagnostics
    };

}


function FindParentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return undefined;
    const { document } = editor;
    const extension = pathModule.extname(document.fileName).toLowerCase();
    if (extension === '.mqh') {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return undefined;
        const workspacepath = workspaceFolders[0].uri.fsPath;

        let NameFileMQL, match, regEx = new RegExp('(\\/\\/###<).+(mq[4|5]>)', 'ig');

        while (match = regEx.exec(document.lineAt(0).text))
            NameFileMQL = match[0];

        if (NameFileMQL != undefined)
            NameFileMQL = pathModule.join(workspacepath, String(NameFileMQL.match(/(?<=<).+(?=>)/)));

        return NameFileMQL;
    } else {
        return undefined;
    }
}

function tf(date, t, d) {

    switch (t) {
        case 'Y': d = date.getFullYear(); break;
        case 'M': d = date.getMonth() + 1; break;
        case 'D': d = date.getDate(); break;
        case 'h': d = date.getHours(); break;
        case 'm': d = date.getMinutes(); break;
        case 's': d = date.getSeconds(); break;
    }

    return d < 10 ? '0' + d.toString() : d.toString();
}

function FixFormatting() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const { document, edit } = editor, array = [];
    const data = {
        reg: [
            "\\bC '\\d{1,3},\\d{1,3},\\d{1,3}'",
            "\\bC '0x[A-Fa-f0-9]{2},0x[A-Fa-f0-9]{2},0x[A-Fa-f0-9]{2}'",
            "\\bD '(?:(?:\\d{2}|\\d{4})\\.\\d{2}\\.(?:\\d{2}|\\d{4})|(?:\\d{2}|\\d{4})\\.\\d{2}\\.(?:\\d{2}|\\d{4})\\s{1,}[\\d:]+)'"
        ],
        searchValue: [
            "C ",
            "C ",
            "D "
        ],
        replaceValue: [
            "C",
            "C",
            "D"
        ]
    };

    Array.from(document.getText().matchAll(new RegExp(CollectRegEx(data.reg), 'g'))).map(match => {
        for (const i in data.reg) {
            if (match[0].match(new RegExp(data.reg[i], 'g'))) {
                let range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length))
                array.push({ range, to: document.getText(range).replace(data.searchValue[i], data.replaceValue[i]) })
            }
        }
    });

    array.length && edit(edit => array.forEach(({ range, to }) => edit.replace(range, to)));
}

function CollectRegEx(dt, string = "") {
    for (const i in dt) {
        string += dt[i] + '|';
    }
    return string.slice(0, -1);
}

/**
 * Code Action provider for unknown type errors - offers quick fixes
 */
class UnknownTypeCodeActionProvider {
    provideCodeActions(document, _range, context) {
        const actions = [];

        for (const diagnostic of context.diagnostics) {
            // Match clangd's "unknown type name 'XXX'" error
            const match = diagnostic.message.match(/unknown type name '(\w+)'/i);
            if (!match) continue;

            const typeName = match[1];

            // Action 1: Add #ifdef __clang__ include at top of file
            const insertIncludeAction = new vscode.CodeAction(
                `Add #ifdef __clang__ include for '${typeName}'`,
                vscode.CodeActionKind.QuickFix
            );
            insertIncludeAction.edit = new vscode.WorkspaceEdit();
            const includeText = `#ifdef __clang__\n#include <${typeName}.mqh>  // TODO: Adjust path if needed\n#endif\n\n`;
            insertIncludeAction.edit.insert(document.uri, new vscode.Position(0, 0), includeText);
            insertIncludeAction.diagnostics = [diagnostic];
            actions.push(insertIncludeAction);


        }

        return actions;
    }
}

function activate(context) {
    const extensionId = 'ngsoftware.mql-tools';
    const currentVersion = vscode.extensions.getExtension(extensionId)?.packageJSON.version;
    const previousVersion = context.globalState.get('mql-tools.version');

    // Wait for environment to stabilize before migration check
    sleep(2000).then(() => {
        if (previousVersion !== currentVersion) {
            if (currentVersion === '1.0.0' || currentVersion === '1.0.1' || currentVersion === '1.0.2') {
                CreateProperties().then(() => {
                    // Update successful info message
                    // console.log(`MQL Tools: Migrated to v${currentVersion}`);
                });
            }
            context.globalState.update('mql-tools.version', currentVersion);
        }
    });

    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.checkFile', () => Compile(0)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.compileFile', () => Compile(1)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.compileScript', () => Compile(2)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.help', () => Help(true)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.configurations', async () => await CreateProperties()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.Addicon', () => IconsInstallation()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.Showfiles', () => ShowFiles('**/*.ex4', '**/*.ex5')));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsMQL', () => InsertMQL()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsMQH', () => InsertMQH()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsNameMQL', (uri) => InsertNameFileMQL(uri)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsNameMQH', (uri) => InsertNameFileMQH(uri)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsResource', () => InsertResource()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsImport', () => InsertImport()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsTime', () => InsertTime()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.InsIcon', () => InsertIcon()));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.openInME', (uri) => OpenFileInMetaEditor(uri)));
    context.subscriptions.push(vscode.commands.registerCommand('mql_tools.commentary', () => CreateComment()));
    context.subscriptions.push(vscode.languages.registerHoverProvider('mql-output', Hover_log()));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider('mql-output', DefinitionProvider()));
    context.subscriptions.push(vscode.languages.registerHoverProvider({ pattern: '**/*.{mq4,mq5,mqh}' }, Hover_MQL()));
    context.subscriptions.push(vscode.languages.registerColorProvider({ pattern: '**/*.{mq4,mq5,mqh}' }, ColorProvider()));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ pattern: '**/*.{mq4,mq5,mqh}' }, ItemProvider()));
    sleep(1000).then(() => { context.subscriptions.push(vscode.languages.registerSignatureHelpProvider({ pattern: '**/*.{mq4,mq5,mqh}' }, HelpProvider(), '(', ',')); });

    // Register Code Action provider for unknown type fixes
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider(
        { pattern: '**/*.{mq4,mq5,mqh}' },
        new UnknownTypeCodeActionProvider(),
        { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    ));

}

function deactivate() {
}


module.exports = {
    activate,
    deactivate,
    replaceLog,
    lg,
    tf
}
