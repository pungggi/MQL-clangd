#!/usr/bin/env node
/**
 * MQL5 Definitions Check Script
 * 
 * This script helps maintain the mql_clangd_compat.h file by:
 * 1. Checking for known missing constants/enums reported by users
 * 2. Validating that existing definitions are still present
 * 3. Providing a simple way to track what needs to be added
 * 
 * Usage: node scripts/check-definitions.js
 */

const fs = require('fs');
const path = require('path');

const COMPAT_HEADER_PATH = path.join(__dirname, '..', 'files', 'mql_clangd_compat.h');

// Known missing definitions reported by users
// Add new entries here when users report missing constants
const KNOWN_MISSING = [
    // Format: { name: 'CONSTANT_NAME', type: 'enum|define|function', addedIn: 'build XXXX', issue: '#XX' }
    // Example: { name: 'DEAL_REASON_CORPORATE_ACTION', type: 'enum', addedIn: 'Build 4230', issue: '#98' },
];

// Required definitions that must be present
const REQUIRED_DEFINITIONS = [
    // Core types
    'datetime', 'color', 'string', 'uchar', 'ushort', 'uint', 'ulong',
    
    // Common structures
    'MqlRates', 'MqlTick', 'MqlTradeRequest', 'MqlTradeResult',
    
    // Common enums
    'ENUM_TIMEFRAMES', 'ENUM_MA_METHOD', 'ENUM_APPLIED_PRICE',
    'ENUM_ORDER_TYPE', 'ENUM_POSITION_TYPE', 'ENUM_DEAL_TYPE',
    
    // Common functions
    'OrderSend', 'PositionSelect', 'CopyRates', 'CopyBuffer',
    'iMA', 'iRSI', 'iMACD', 'iCustom',
    'Print', 'Comment', 'Alert',
    'ArrayResize', 'ArraySize', 'ArrayCopy',
    'StringFormat', 'StringSubstr', 'StringLen',
    'FileOpen', 'FileClose', 'FileWrite',
    'ObjectCreate', 'ObjectDelete', 'ObjectSetInteger',
    'ChartOpen', 'ChartClose', 'ChartGetInteger',
];

function main() {
    console.log('MQL5 Definitions Check\n');
    console.log('='.repeat(50));
    
    // Read the compat header
    let headerContent;
    try {
        headerContent = fs.readFileSync(COMPAT_HEADER_PATH, 'utf8');
    } catch (err) {
        console.error(`Error: Could not read ${COMPAT_HEADER_PATH}`);
        console.error(err.message);
        process.exit(1);
    }
    
    console.log(`\nChecking: ${COMPAT_HEADER_PATH}\n`);
    
    // Check known missing definitions
    if (KNOWN_MISSING.length > 0) {
        console.log('Known Missing Definitions:');
        console.log('-'.repeat(50));
        
        let stillMissing = 0;
        for (const def of KNOWN_MISSING) {
            if (!headerContent.includes(def.name)) {
                console.log(`❌ MISSING: ${def.name}`);
                console.log(`   Type: ${def.type}, Added in: ${def.addedIn}`);
                if (def.issue) console.log(`   Issue: ${def.issue}`);
                stillMissing++;
            } else {
                console.log(`✅ ADDED:   ${def.name}`);
            }
        }
        
        if (stillMissing > 0) {
            console.log(`\n⚠️  ${stillMissing} definition(s) still need to be added.\n`);
        } else {
            console.log(`\n✅ All known missing definitions have been added!\n`);
        }
    } else {
        console.log('No known missing definitions to check.\n');
        console.log('When users report missing MQL5 constants, add them to');
        console.log('the KNOWN_MISSING array in this script.\n');
    }
    
    // Check required definitions
    console.log('Required Definitions Check:');
    console.log('-'.repeat(50));
    
    let missingRequired = 0;
    for (const def of REQUIRED_DEFINITIONS) {
        if (!headerContent.includes(def)) {
            console.log(`❌ MISSING: ${def}`);
            missingRequired++;
        }
    }
    
    if (missingRequired > 0) {
        console.log(`\n⚠️  ${missingRequired} required definition(s) are missing!`);
        process.exit(1);
    } else {
        console.log(`✅ All ${REQUIRED_DEFINITIONS.length} required definitions are present.\n`);
    }
    
    // Statistics
    const enumCount = (headerContent.match(/^enum\s+ENUM_/gm) || []).length;
    const defineCount = (headerContent.match(/^#define\s+/gm) || []).length;
    const functionCount = (headerContent.match(/^[a-z_]+\s+\w+\s*\([^;]+\);$/gm) || []).length;
    const structCount = (headerContent.match(/^struct\s+/gm) || []).length;
    
    console.log('Header Statistics:');
    console.log('-'.repeat(50));
    console.log(`Enums:     ~${enumCount}`);
    console.log(`Defines:   ~${defineCount}`);
    console.log(`Structs:   ~${structCount}`);
    console.log(`File size: ${(headerContent.length / 1024).toFixed(1)} KB`);
    console.log(`Lines:     ${headerContent.split('\n').length}`);
    console.log('');
}

main();

