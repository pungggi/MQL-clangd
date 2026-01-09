'use strict';
const vscode = require('vscode');
const language = vscode.env.language;

// Map VS Code language codes to MQL5 web URL language codes
const webLangMap = {
    'en': 'en',
    'ru': 'ru',
    'de': 'de',
    'es': 'es',
    'fr': 'fr',
    'zh-cn': 'zh',
    'zh-tw': 'zh',
    'it': 'it',
    'ja': 'ja',
    'pt-br': 'pt',
    'tr': 'tr'
};

/**
 * Opens web-based MQL documentation
 * @param {number} version - MQL version (4 or 5)
 * @param {string} keyword - Keyword to search for
 */
function openWebHelp(version, keyword) {
    const webLang = webLangMap[language] || 'en';
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

/**
 * Main help function - opens web-based MQL documentation
 */
function Help() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return undefined;

    const { document, selection } = editor;
    const { start, end } = selection;

    if (end.line !== start.line) return undefined;

    const isSelectionSearch = end.character !== start.character;
    const wordAtCursorRange = isSelectionSearch
        ? selection
        : document.getWordRangeAtPosition(end, /(#\w+|\w+)/);

    if (!wordAtCursorRange) return undefined;

    const keyword = document.getText(wordAtCursorRange);
    const extension = document.fileName.toLowerCase();
    const wn = vscode.workspace.name ? vscode.workspace.name.includes('MQL4') : false;

    // Determine MQL version
    let version;
    if (extension.endsWith('.mq4') || (extension.endsWith('.mqh') && wn)) {
        version = 4;
    } else if (extension.endsWith('.mq5') || (extension.endsWith('.mqh') && !wn)) {
        version = 5;
    } else {
        return undefined;
    }

    openWebHelp(version, keyword);
}

module.exports = {
    Help
}