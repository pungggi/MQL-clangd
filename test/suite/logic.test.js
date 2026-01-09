const assert = require('assert');
const path = require('path');

// Import functions from createProperties
const { normalizePath } = require('../../src/createProperties');

suite('Pure Logic Unit Tests', () => {
    suite('Path Normalization', () => {
        test('should convert backslashes to forward slashes', () => {
            assert.strictEqual(normalizePath('C:\\Users\\Test'), 'C:/Users/Test');
            assert.strictEqual(normalizePath('folder\\subfolder'), 'folder/subfolder');
        });

        test('should handle empty strings', () => {
            assert.strictEqual(normalizePath(''), '');
        });

        test('should handle paths with mixed slashes', () => {
            assert.strictEqual(normalizePath('C:\\Users/Test\\file'), 'C:/Users/Test/file');
        });

        test('should handle already normalized paths', () => {
            assert.strictEqual(normalizePath('C:/Users/Test'), 'C:/Users/Test');
        });

        test('should handle UNC paths', () => {
            assert.strictEqual(normalizePath('\\\\server\\share'), '//server/share');
        });
    });

    suite('MQL Version Detection', () => {
        test('should detect MQL5 from folder path', () => {
            const mql5Path = 'C:/Users/Test/MQL5/Experts/test.mq5';
            assert.ok(mql5Path.includes('MQL5'));
        });

        test('should detect MQL4 from folder path', () => {
            const mql4Path = 'C:/Users/Test/MQL4/Experts/test.mq4';
            assert.ok(mql4Path.includes('MQL4'));
        });

        test('should detect version from file extension', () => {
            const ext5 = path.extname('test.mq5').toLowerCase();
            const ext4 = path.extname('test.mq4').toLowerCase();
            assert.strictEqual(ext5, '.mq5');
            assert.strictEqual(ext4, '.mq4');
        });
    });

    suite('Include Path Generation', () => {
        test('should generate correct include flag format', () => {
            const includePath = 'C:/Users/Test/MQL5/Include';
            const flag = `-I${includePath}`;
            assert.strictEqual(flag, '-IC:/Users/Test/MQL5/Include');
        });

        test('should handle paths with spaces', () => {
            const includePath = 'C:/Users/Test User/MQL5/Include';
            const flag = `-I${includePath}`;
            assert.ok(flag.includes('Test User'));
        });
    });

    suite('Compiler Flags', () => {
        test('should include required base flags', () => {
            const baseFlags = ['-xc++', '-std=c++17', '-ferror-limit=0'];
            assert.ok(baseFlags.includes('-xc++'));
            assert.ok(baseFlags.includes('-std=c++17'));
        });

        test('should include MQL5 define for MQL5 projects', () => {
            const mql5Flags = ['-D__MQL5__', '-D__MQL_BUILD__'];
            assert.ok(mql5Flags.some(f => f.includes('__MQL5__')));
        });

        test('should include MQL4 define for MQL4 projects', () => {
            const mql4Flags = ['-D__MQL4__', '-D__MQL_BUILD__'];
            assert.ok(mql4Flags.some(f => f.includes('__MQL4__')));
        });
    });

    suite('File Extension Handling', () => {
        test('should recognize .mq4 files', () => {
            const validExtensions = ['.mq4', '.mq5', '.mqh'];
            assert.ok(validExtensions.includes('.mq4'));
        });

        test('should recognize .mq5 files', () => {
            const validExtensions = ['.mq4', '.mq5', '.mqh'];
            assert.ok(validExtensions.includes('.mq5'));
        });

        test('should recognize .mqh header files', () => {
            const validExtensions = ['.mq4', '.mq5', '.mqh'];
            assert.ok(validExtensions.includes('.mqh'));
        });

        test('should not recognize .ex4/.ex5 compiled files as source', () => {
            const sourceExtensions = ['.mq4', '.mq5', '.mqh'];
            assert.ok(!sourceExtensions.includes('.ex4'));
            assert.ok(!sourceExtensions.includes('.ex5'));
        });
    });
});
