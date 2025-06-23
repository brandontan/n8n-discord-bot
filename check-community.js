#!/usr/bin/env node

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

console.log('🔍 Checking Discord Community Status...\n');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log(`✅ Connected as: ${client.user.tag}\n`);
    
    for (const guild of client.guilds.cache.values()) {
        console.log(`🏢 Server: ${guild.name}`);
        console.log(`📋 Server ID: ${guild.id}`);
        console.log(`👑 Owner: ${guild.ownerId}`);
        console.log(`📊 Members: ${guild.memberCount}`);
        
        const features = guild.features || [];
        console.log(`🎯 Features: ${features.length > 0 ? features.join(', ') : 'None'}`);
        
        const hasCommunity = features.includes('COMMUNITY');
        console.log(`🏛️ Community Enabled: ${hasCommunity ? '✅ YES' : '❌ NO'}`);
        
        if (!hasCommunity) {
            console.log(`\n🚨 FORUM CHANNELS REQUIRE COMMUNITY FEATURES!\n`);
            console.log(`📝 TO ENABLE:`);
            console.log(`   1. Go to Discord Server Settings`);
            console.log(`   2. Click "Enable Community"`);
            console.log(`   3. Complete the setup wizard`);
            console.log(`   4. Run /setup again\n`);
        } else {
            console.log(`\n✨ Great! Forum channels will work perfectly!\n`);
        }
        
        console.log('─'.repeat(50));
    }
    
    setTimeout(() => {
        console.log('\n🎯 Check complete!');
        process.exit(0);
    }, 2000);
});

client.on('error', error => {
    console.error('❌ Discord client error:', error);
    process.exit(1);
});

if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN environment variable is required');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login:', error.message);
    process.exit(1);
});
