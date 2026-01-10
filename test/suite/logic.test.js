const assert = require('assert');
const { normalizePath } = require('../../src/createProperties');

suite('Pure Logic Unit Tests', () => {
    test('Path Normalization', () => {
        assert.strictEqual(normalizePath('C:\\Users\\Test'), 'C:/Users/Test');
        assert.strictEqual(normalizePath('folder\\subfolder'), 'folder/subfolder');
        assert.strictEqual(normalizePath(''), '');
    });
});
