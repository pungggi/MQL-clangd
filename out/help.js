'use strict';
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const language = vscode.env.language;

// Map VS Code language codes to MQL5 web URL language codes
// MQL5 supports: en, ru, zh, es, pt, ja, de, ko, fr, it, tr
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
    'ko': 'ko',
    'pt-br': 'pt',
    'tr': 'tr'
};

// Load MQL5 docs mapping
let mql5DocsMap = null;
function loadMql5DocsMap() {
    if (mql5DocsMap !== null) return mql5DocsMap;
    try {
        const docsPath = path.join(__dirname, '..', 'data', 'mql5-docs.json');
        if (fs.existsSync(docsPath)) {
            mql5DocsMap = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
        } else {
            mql5DocsMap = {};
        }
    } catch (err) {
        console.error('Failed to load MQL5 docs map:', err);
        mql5DocsMap = {};
    }
    return mql5DocsMap;
}

/**
 * Opens web-based MQL documentation
 * @param {number} version - MQL version (4 or 5)
 * @param {string} keyword - Keyword to search for
 */
function openWebHelp(version, keyword) {
    const webLang = webLangMap[language] || 'en';
    let helpUrl;

    if (version === 4) {
        // MQL4 docs - direct search in documentation
        helpUrl = `https://docs.mql4.com/search?keyword=${encodeURIComponent(keyword)}`;
    } else {
        // MQL5 docs - try direct link first, fallback to search
        const docsMap = loadMql5DocsMap();
        const keyLower = keyword.toLowerCase();

        const category = docsMap[keyLower];
        if (category) {
            // Direct link to documentation page
            helpUrl = `https://www.mql5.com/${webLang}/docs/${category}/${keyLower}`;
        } else {
            // Fallback to search
            helpUrl = `https://www.mql5.com/${webLang}/search#!keyword=${encodeURIComponent(keyword)}&module=docs`;
        }
    }

    vscode.env.openExternal(vscode.Uri.parse(helpUrl));
}

/**
 * Main help function - opens web-based MQL documentation
 */
function Help() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('MQL Help: No active editor');
        return;
    }

    const { document, selection } = editor;
    const fileName = document.fileName.toLowerCase();

    // Check if it's an MQL file
    const isMQL = fileName.endsWith('.mq4') || fileName.endsWith('.mq5') || fileName.endsWith('.mqh');
    if (!isMQL) {
        vscode.window.showInformationMessage('MQL Help: Only available for .mq4, .mq5, .mqh files');
        return;
    }

    const { start, end } = selection;
    if (end.line !== start.line) return;

    const isSelectionSearch = end.character !== start.character;
    const wordAtCursorRange = isSelectionSearch
        ? selection
        : document.getWordRangeAtPosition(end, /(#\w+|\w+)/);

    if (!wordAtCursorRange) {
        vscode.window.showInformationMessage('MQL Help: Place cursor on a keyword');
        return;
    }

    const keyword = document.getText(wordAtCursorRange);
    const wn = vscode.workspace.name ? vscode.workspace.name.includes('MQL4') : false;

    // Determine MQL version
    let version;
    if (fileName.endsWith('.mq4') || (fileName.endsWith('.mqh') && wn)) {
        version = 4;
    } else {
        version = 5;
    }

    openWebHelp(version, keyword);
}

module.exports = {
    Help
}