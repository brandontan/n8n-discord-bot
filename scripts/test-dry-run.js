#!/usr/bin/env node

/**
 * Test script to demonstrate dry run functionality
 * 
 * Usage:
 *   node scripts/test-dry-run.js                    # Normal mode
 *   DRY_RUN=true node scripts/test-dry-run.js       # Dry run mode
 */

require('dotenv').config();
const GuildStateManager = require('../src/modules/guildStateManager');

async function testDryRunMode() {
    const stateManager = new GuildStateManager();
    
    console.log('🧪 Testing Dry Run Mode Functionality\n');
    
    // Test dry run detection
    const isDryRun = stateManager.isDryRun();
    console.log(`Dry Run Mode: ${isDryRun ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`Environment Variable DRY_RUN: ${process.env.DRY_RUN || 'not set'}\n`);
    
    // Test dry run logging
    console.log('Testing dry run logging:');
    const logged1 = stateManager.logDryRun('Creating Role', { name: 'Test Role', color: '#ff0000' });
    const logged2 = stateManager.logDryRun('Creating Channel', { name: 'test-channel', type: 'text' });
    
    if (!logged1 && !logged2) {
        console.log('No dry run logs (normal mode)');
    }
    
    console.log('\n📖 Instructions:');
    console.log('1. Run with DRY_RUN=true to enable dry run mode');
    console.log('2. Run with DRY_RUN=false or no DRY_RUN to disable');
    console.log('3. The Discord bot will respect this setting in /setup command');
    
    console.log('\n🎯 Examples:');
    console.log('  DRY_RUN=true npm start         # Start bot in dry run mode');
    console.log('  DRY_RUN=1 npm start            # Alternative syntax');
    console.log('  npm start                      # Normal mode (no DRY_RUN)');
    
    // Test error hint functionality
    console.log('\n🔍 Testing Error Hints:');
    
    const mockErrors = [
        { code: 50013, message: 'Missing Permissions' },
        { code: 50001, message: 'Missing Access' },
        { code: 50035, message: 'Invalid Form Body' },
        { code: 30013, message: 'Maximum number of roles reached' },
        { code: null, message: 'Unknown error' }
    ];
    
    mockErrors.forEach(error => {
        const hint = stateManager.getErrorHint(error);
        console.log(`\nError ${error.code || 'unknown'}:`);
        console.log(`  Title: ${hint.title}`);
        console.log(`  Message: ${hint.message}`);
        console.log(`  Suggestions: ${hint.suggestions.length} provided`);
    });
}

// Run the test
testDryRunMode().catch(console.error);
