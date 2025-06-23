#!/usr/bin/env node

/**
 * Environment Setup Script for Discord Community Features
 * Checks and configures required environment variables
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Discord Community Server Environment Setup\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found existing .env file');
} else {
    console.log('📝 Creating new .env file');
}

// Required environment variables
const requiredVars = {
    'DISCORD_TOKEN': {
        description: 'Discord bot token from Developer Portal',
        required: true,
        example: 'YOUR_DISCORD_BOT_TOKEN_HERE'
    },
    'UNSPLASH_ACCESS_KEY': {
        description: 'Unsplash API access key for downloading community assets',
        required: false,
        example: 'YOUR_UNSPLASH_ACCESS_KEY_HERE',
        url: 'https://unsplash.com/developers'
    },
    'NODE_ENV': {
        description: 'Environment mode',
        required: false,
        example: 'production',
        default: 'production'
    },
    'TZ': {
        description: 'Timezone for scheduled events',
        required: false,
        example: 'UTC',
        default: 'UTC'
    },
    'PORT': {
        description: 'Port for health check server (Render deployment)',
        required: false,
        example: '3000',
        default: '3000'
    },
    'LOG_LEVEL': {
        description: 'Logging level for debugging',
        required: false,
        example: 'info',
        default: 'info'
    }
};

// Parse existing .env content
const existingVars = {};
envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        existingVars[key.trim()] = values.join('=').trim();
    }
});

// Check each required variable
const missingRequired = [];
const suggestions = [];

Object.entries(requiredVars).forEach(([key, config]) => {
    const exists = existingVars[key];
    
    if (config.required && (!exists || exists === 'YOUR_' + key)) {
        missingRequired.push(key);
        console.log(`❌ MISSING REQUIRED: ${key}`);
        console.log(`   Description: ${config.description}`);
        if (config.url) console.log(`   Get it from: ${config.url}`);
        console.log(`   Example: ${config.example}\n`);
    } else if (exists) {
        if (exists.startsWith('YOUR_')) {
            console.log(`⚠️  PLACEHOLDER: ${key} (needs real value)`);
            suggestions.push(`Update ${key} with actual value`);
        } else {
            console.log(`✅ ${key}: ${exists.substring(0, 20)}${exists.length > 20 ? '...' : ''}`);
        }
    } else {
        console.log(`➕ OPTIONAL: ${key} (will use default: ${config.default || 'none'})`);
        if (!config.default) {
            suggestions.push(`Add ${key} for enhanced features`);
        }
    }
});

// Update .env file with defaults
let newEnvContent = envContent;

Object.entries(requiredVars).forEach(([key, config]) => {
    if (!existingVars[key] && config.default) {
        newEnvContent += `\n# ${config.description}\n${key}=${config.default}\n`;
        console.log(`➕ Added ${key}=${config.default}`);
    }
});

// Write updated .env file
if (newEnvContent !== envContent) {
    fs.writeFileSync(envPath, newEnvContent);
    console.log('\n📝 Updated .env file with defaults');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📋 ENVIRONMENT SETUP SUMMARY');
console.log('='.repeat(50));

if (missingRequired.length === 0) {
    console.log('🎉 All required environment variables are configured!');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Ensure your Discord server has Community features enabled');
    console.log('2. Run `npm start` to start the bot locally');
    console.log('3. Deploy to Render with environment variables');
    console.log('4. Run `/setup-community` in Discord to configure advanced features');
    
    if (suggestions.length > 0) {
        console.log('\n💡 OPTIONAL IMPROVEMENTS:');
        suggestions.forEach(suggestion => console.log(`• ${suggestion}`));
    }
} else {
    console.log('❌ SETUP INCOMPLETE');
    console.log('\nMISSING REQUIRED VARIABLES:');
    missingRequired.forEach(key => console.log(`• ${key}`));
    
    console.log('\n📝 TO FIX:');
    console.log('1. Get your Discord bot token from https://discord.com/developers/applications');
    console.log('2. Add it to .env file: DISCORD_TOKEN=your_token_here');
    console.log('3. For Render deployment, add it to environment variables in dashboard');
    console.log('4. Run this script again to verify');
}

console.log('\n🎯 FOR RENDER DEPLOYMENT:');
console.log('Remember to add all environment variables to Render dashboard:');
console.log('Render Dashboard → Service → Environment Variables');

// Create a deployment guide
const deployGuide = `# Discord Community Server Deployment Guide

## 🚀 Render.com Deployment

### 1. Environment Variables (Required in Render Dashboard)
\`\`\`
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
NODE_ENV=production
TZ=UTC
PORT=10000
LOG_LEVEL=info
\`\`\`

### 2. Optional for Enhanced Features
\`\`\`
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
\`\`\`

### 3. Deployment Steps
1. Push code to GitHub
2. Connect Render to GitHub repo
3. Add environment variables in Render dashboard
4. Deploy service
5. Run \`/setup-community\` in Discord

### 4. Discord Server Setup
1. Enable Community features in Server Settings
2. Complete community setup wizard
3. Run bot commands to configure channels and roles

## 🎯 Community Features Available

- ✅ Forum channels with tags
- ✅ Server guide and onboarding
- ✅ Visual asset downloads (with Unsplash key)
- ✅ Auto-moderation configuration
- ✅ Welcome screen setup
- ✅ Advanced role management

Your n8n automation community will be professional and engaging!
`;

fs.writeFileSync(path.join(__dirname, 'DEPLOYMENT_GUIDE.md'), deployGuide);
console.log('\n📋 Created DEPLOYMENT_GUIDE.md with detailed instructions');

console.log('\n✨ Environment setup complete!');
