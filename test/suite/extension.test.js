const assert = require('assert');
const Module = require('module');

// 1. Hook the Node.js module loader to intercept 'vscode'
const vscodeMock = require('../mocks/vscode');
const originalLoad = Module._load;
Module._load = function (request) {
    if (request === 'vscode') {
        return vscodeMock;
    }
    return originalLoad.apply(this, arguments);
};

// 2. Load the modules under test (they will now get the mock)
const { replaceLog } = require('../../src/extension');
const { normalizePath } = require('../../src/createProperties');

suite('Core Logic Unit Tests (Independent)', () => {

    test('Path Normalization', () => {
        assert.strictEqual(normalizePath('C:\\Users\\Test'), 'C:/Users/Test');
        assert.strictEqual(normalizePath('folder\\subfolder'), 'folder/subfolder');
        assert.strictEqual(normalizePath(''), '');
    });

    test('Log Parsing - Compilation Start', () => {
        const logStr = 'C:\\Project : information: compiling \'Main.mq5\'';
        const result = replaceLog(logStr, true);
        assert.strictEqual(result.text.includes('Main.mq5'), true);
    });

    test('Log Parsing - Error Detection', () => {
        const logStr = 'C:\\Project\\Main.mq5(10,5) : error 123: unexpected token';
        const result = replaceLog(logStr, true);

        assert.strictEqual(result.error, true);
        assert.strictEqual(result.diagnostics.length, 1);
        assert.strictEqual(result.diagnostics[0].message, 'unexpected token');
        assert.strictEqual(result.diagnostics[0].file, 'C:\\Project\\Main.mq5');
        assert.strictEqual(result.diagnostics[0].range.start.line, 9); // 10-1
        assert.strictEqual(result.diagnostics[0].range.start.character, 4); // 5-1
        assert.strictEqual(result.diagnostics[0].severity, 0); // Error
    });

    test('Log Parsing - Warning Detection', () => {
        const logStr = 'C:\\Project\\Main.mq5(20,1) : warning 456: obsolete function';
        const result = replaceLog(logStr, true);

        assert.strictEqual(result.diagnostics.length, 1);
        assert.strictEqual(result.diagnostics[0].severity, 1); // Warning
    });

    test('Log Parsing - Result Line', () => {
        const logStr = '0 error(s), 0 warning(s), compile time: 100 msec';
        const result = replaceLog(logStr, true);
        assert.strictEqual(result.error, false);
    });
});
