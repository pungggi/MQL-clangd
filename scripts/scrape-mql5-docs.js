/**
 * Scrapes MQL5 documentation to build a function-to-URL mapping
 * Run with: node scripts/scrape-mql5-docs.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// MQL5 documentation categories (from https://www.mql5.com/en/docs)
const CATEGORIES = [
    'basis',           // Language Basics
    'constants',       // Constants, Enumerations and Structures
    'runtime',         // MQL5 programs
    'predefined',      // Predefined Variables
    'common',          // Common Functions
    'array',           // Array Functions
    'matrix',          // Matrix and Vector Methods
    'convert',         // Conversion Functions
    'math',            // Math Functions
    'strings',         // String Functions
    'datetime',        // Date and Time
    'account',         // Account Information
    'checkup',         // Checkup
    'event_handlers',  // Event Handling (actually 'eventhandlers')
    'marketinformation', // Market Info
    'economiccalendar', // Economic Calendar
    'series',          // Timeseries and Indicators Access
    'customsymbols',   // Custom Symbols
    'chart_operations', // Chart Operations
    'trading',         // Trade Functions
    'tradesignals',    // Trade Signals
    'network',         // Network Functions
    'globals',         // Global Variables of the Terminal
    'files',           // File Functions
    'customind',       // Custom Indicators
    'objects',         // Object Functions
    'indicators',      // Technical Indicators
    'optimization',    // Working with Optimization Results
    'events',          // Working with Events
    'opencl',          // Working with OpenCL
    'database',        // Working with databases
    'directx',         // Working with DirectX
    'python',          // Python Integration
    'onnx',            // ONNX models
    'standardlibrary', // Standard Library
];

const BASE_URL = 'https://www.mql5.com/en/docs/';

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractFunctions(html, category) {
    const functions = [];
    const seen = new Set();

    // The sidebar contains links like: href="/en/docs/trading/ordersend"
    // Also match links in the content table
    const regex = /href="\/en\/docs\/([a-z0-9_]+)\/([a-z0-9_]+)"/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const cat = match[1].toLowerCase();
        const funcName = match[2].toLowerCase();
        const key = `${cat}/${funcName}`;

        if (!seen.has(key)) {
            seen.add(key);
            functions.push({
                name: funcName,
                category: cat
            });
        }
    }

    return functions;
}

async function scrapeCategory(category) {
    console.log(`Scraping category: ${category}...`);
    try {
        const html = await fetchPage(BASE_URL + category);
        return extractFunctions(html, category);
    } catch (err) {
        console.error(`Error scraping ${category}:`, err.message);
        return [];
    }
}

async function main() {
    console.log('Starting MQL5 documentation scrape...\n');

    const allFunctions = {};

    for (const category of CATEGORIES) {
        const functions = await scrapeCategory(category);
        for (const func of functions) {
            // Store with lowercase key for case-insensitive lookup
            // Value is just the category string (language is added dynamically)
            allFunctions[func.name] = func.category;
        }
        // Small delay to be nice to the server
        await new Promise(r => setTimeout(r, 500));
    }

    const outputPath = path.join(__dirname, '..', 'data', 'mql5-docs.json');

    // Ensure data directory exists
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(allFunctions, null, 2));

    console.log(`\nDone! Found ${Object.keys(allFunctions).length} functions.`);
    console.log(`Saved to: ${outputPath}`);
}

main().catch(console.error);

