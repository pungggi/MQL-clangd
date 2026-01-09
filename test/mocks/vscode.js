// Mock for vscode API
class Range {
    constructor(startLine, startChar, endLine, endChar) {
        this.start = { line: startLine, character: startChar };
        this.end = { line: endLine, character: endChar };
    }
}

class Position {
    constructor(line, character) {
        this.line = line;
        this.character = character;
    }
}

const DiagnosticSeverity = {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3
};

module.exports = {
    Range,
    Position,
    DiagnosticSeverity,
    env: {
        language: 'en'
    },
    window: {
        showInformationMessage: () => { },
        showErrorMessage: () => { },
        createOutputChannel: () => ({ appendLine: () => { } })
    },
    workspace: {
        getConfiguration: () => ({
            get: () => ({}),
            update: () => { }
        })
    },
    Uri: {
        file: (path) => ({ fsPath: path }),
        parse: (path) => ({ fsPath: path })
    },
    languages: {
        createDiagnosticCollection: () => ({ clear: () => { }, set: () => { } })
    }
};
