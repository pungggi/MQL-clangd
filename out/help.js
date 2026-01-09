'use strict';
const vscode = require('vscode');
const childProcess = require('child_process');
const fs = require('fs');
const pathModule = require('path');
const https = require('https');
const sleep = require('util').promisify(setTimeout);
const language = vscode.env.language;
const ext = require("./extension");

const isWindows = process.platform === 'win32';

// Map internal locale codes to web URL language codes
const webLangMap = {
    '': 'en',
    '_russian': 'ru',
    '_german': 'de',
    '_spanish': 'es',
    '_french': 'fr',
    '_chinese': 'zh',
    '_italian': 'it',
    '_japanese': 'ja',
    '_portuguese': 'pt',
    '_turkish': 'tr'
};

/**
 * Opens web-based MQL documentation
 * @param {number} version - MQL version (4 or 5)
 * @param {string} keyword - Keyword to search for
 * @param {string} loc - Locale code (e.g., '_german', '_russian', '')
 */
function openWebHelp(version, keyword, loc) {
    const webLang = webLangMap[loc] || 'en';
    let helpUrl;

    if (version === 4) {
        // MQL4 docs only support en/ru
        const mql4Lang = (webLang === 'ru') ? 'ru' : 'en';
        helpUrl = `https://docs.mql4.com/${mql4Lang}/search?keyword=${encodeURIComponent(keyword)}`;
    } else {
        // MQL5 docs support multiple languages
        helpUrl = `https://www.mql5.com/${webLang}/docs/search?keyword=${encodeURIComponent(keyword)}`;
    }

    vscode.env.openExternal(vscode.Uri.parse(helpUrl));
}

function Help(sm) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return undefined;
    const { document, selection } = editor, { start, end } = selection;
    if (end.line !== start.line)
        return undefined;
    const isSelectionSearch = end.line !== start.line || end.character !== start.character, wordAtCursorRange = isSelectionSearch ? selection : document.getWordRangeAtPosition(end, /(#\w+|\w+)/);
    if (wordAtCursorRange === undefined)
        return undefined;

    const config = vscode.workspace.getConfiguration('mql_tools'),
        extension = pathModule.extname(document.fileName).toLowerCase(),
        PathKeyHH = pathModule.join(__dirname, '../', 'files', 'KeyHH.exe'),
        wn = vscode.workspace.name ? vscode.workspace.name.includes('MQL4') : false,
        helpval = config.get('Help.HelpVal', 500),
        var_loc4 = config.get('Help.MQL4HelpLanguage', 'Default'),
        var_loc5 = config.get('Help.MQL5HelpLanguage', 'Default'),
        keyword = document.getText(wordAtCursorRange);

    // Check if user prefers web-based help
    const preferWebHelp = config.get('Help.PreferWebHelp', false);

    let v, loc;

    if (extension === '.mq4' || (extension === '.mqh' && wn)) {
        v = 4; loc = var_loc4 === 'Default' ? (language === 'ru' ? '_russian' : '') : (var_loc4 === 'Русский' ? '_russian' : '');
    }
    else if (extension === '.mq5' || (extension === '.mqh' && !wn)) {
        v = 5;
        switch (var_loc5 === 'Default' ? language : var_loc5) {
            case (var_loc5 === 'Default' ? 'ru' : 'Русский'): loc = '_russian'; break;
            case (var_loc5 === 'Default' ? 'zh-cn' : 'Chinese'): loc = '_chinese'; break;
            case (var_loc5 === 'Default' ? 'zh-tw' : 'Chinese'): loc = '_chinese'; break;
            case (var_loc5 === 'Default' ? 'fr' : 'French'): loc = '_french'; break;
            case (var_loc5 === 'Default' ? 'de' : 'German'): loc = '_german'; break;
            case (var_loc5 === 'Default' ? 'it' : 'Italian'): loc = '_italian'; break;
            case (var_loc5 === 'Default' ? 'es' : 'Spanish'): loc = '_spanish'; break;
            case (var_loc5 === 'Default' ? 'ja' : 'Japanese'): loc = '_japanese'; break;
            case (var_loc5 === 'Default' ? 'pt-br' : 'Portuguese'): loc = '_portuguese'; break;
            case (var_loc5 === 'Default' ? 'tr' : 'Turkish'): loc = '_turkish'; break;
            default: loc = ''; break;
        }
    }
    else return undefined;

    // Non-Windows OR user prefers web help: use web-based documentation
    if (!isWindows || preferWebHelp) {
        openWebHelp(v, keyword, loc);
        return;
    }

    // Windows: use local CHM help files
    const PathHelp = pathModule.join(__dirname, '../', 'files', 'help', 'mql' + v + loc + '.chm');

    if (!fs.existsSync(PathHelp))
        return download(v, loc, keyword);

    childProcess.exec(`tasklist /FI "IMAGENAME eq KeyHH.exe"`, (err, stdout) => {
        if (stdout && stdout.includes("KeyHH.exe") != true) {
            childProcess.exec(`"${PathKeyHH}" -Mql "${PathHelp}"`);
            sleep(sm ? helpval : 1000).then(() => { childProcess.exec(`"${PathKeyHH}" -Mql -#klink "${keyword}" "${PathHelp}"`); });
        }
        else
            childProcess.exec(`"${PathKeyHH}" -Mql -#klink "${keyword}" "${PathHelp}"`);
    });
}

function download(n, locname, keyword) {
    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: ext.lg['help_Lo'],
        },
        async () => {
            const helpDir = pathModule.join(__dirname, '../', 'files', 'help');
            try {
                await fs.promises.mkdir(helpDir, { recursive: true });
            } catch (err) { }

            return new Promise((resolve) => {
                const req = https.get('https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/files/help/mql' + n + locname + '.chm',
                    (response) => {
                        if (response.statusCode === 200) {
                            const file = fs.createWriteStream(
                                pathModule.join(__dirname, '../', 'files', 'help', 'mql' + n + locname + '.chm')
                            );
                            response.pipe(file);

                            file.on('error', () => {
                                resolve();
                                vscode.window.showErrorMessage(ext.lg['help_er_save']);
                                // Fallback to web help on error
                                if (keyword) openWebHelp(n, keyword, locname);
                            });

                            file.on('finish', () => {
                                file.close();
                                resolve();
                                Help(false);
                            });
                        } else {
                            resolve();
                            vscode.window.showErrorMessage(`${ext.lg['help_er_statusCode']} ${response.statusCode}`);
                            // Fallback to web help on error
                            if (keyword) openWebHelp(n, keyword, locname);
                        }
                    }
                );

                req.on('error', () => {
                    resolve();
                    vscode.window.showErrorMessage(ext.lg['help_er_noconnect']);
                    // Fallback to web help on error
                    if (keyword) openWebHelp(n, keyword, locname);
                });
            });
        }
    );
}

module.exports = {
    Help
}