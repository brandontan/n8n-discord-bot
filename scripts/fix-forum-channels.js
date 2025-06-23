#!/usr/bin/env node

/**
 * Forum Channel Conversion Script
 * 
 * This script identifies text channels that should be forum channels
 * and attempts to convert them manually.
 * 
 * Usage: node scripts/fix-forum-channels.js
 */

require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

// Channels that should be forum channels based on blueprint
const FORUM_CHANNEL_CONFIGS = {
    'project-portfolio': {
        description: '🎨 Showcase your masterpieces! Share client work, success stories, and testimonials that make you shine!',
        tags: [
            { name: 'Beginner', emoji: '🌱' },
            { name: 'Intermediate', emoji: '🔧' },
            { name: 'Advanced', emoji: '🚀' },
            { name: 'Expert/Professional', emoji: '⭐' },
            { name: 'AI & ML', emoji: '🤖' },
            { name: 'E-commerce', emoji: '🛒' },
            { name: 'Marketing', emoji: '📈' },
            { name: 'Data Processing', emoji: '📊' },
            { name: 'API Integration', emoji: '🔗' },
            { name: 'Workflow Templates', emoji: '📋' }
        ]
    },
    'use-case-ideas': {
        description: '💡 Share automation ideas and get inspired! Post your concepts and browse what others are building!',
        tags: [
            { name: 'Beginner', emoji: '🌱' },
            { name: 'Intermediate', emoji: '🔧' },
            { name: 'Advanced', emoji: '🚀' },
            { name: 'Expert/Pro', emoji: '⭐' },
            { name: 'E-commerce', emoji: '🛒' },
            { name: 'Marketing', emoji: '📈' },
            { name: 'Data & Analytics', emoji: '📊' },
            { name: 'API Integration', emoji: '🔗' }
        ]
    },
    'client-solutions': {
        description: '🎯 Real-world success stories! Share how automation solved actual client problems and inspire others!',
        tags: [
            { name: 'Beginner', emoji: '🌱' },
            { name: 'Intermediate', emoji: '🔧' },
            { name: 'Advanced', emoji: '🚀' },
            { name: 'Expert/Pro', emoji: '⭐' },
            { name: 'Case Study', emoji: '📝' },
            { name: 'Before/After', emoji: '📊' },
            { name: 'ROI Success', emoji: '💰' }
        ]
    },
    'integration-issues': {
        description: '🔧 API troubles? Connection problems? Get expert help debugging your integrations and make them work flawlessly!',
        tags: [
            { name: 'API Issues', emoji: '🔗' },
            { name: 'Authentication', emoji: '🔐' },
            { name: 'Webhooks', emoji: '📬' },
            { name: 'Database', emoji: '🗄' },
            { name: 'Cloud Services', emoji: '☁️' },
            { name: 'Solved', emoji: '✅', moderated: true }
        ]
    },
    'advanced-expressions': {
        description: '🧠 Master complex logic! Share advanced expressions, JavaScript tricks, and sophisticated automation patterns!',
        tags: [
            { name: 'JavaScript', emoji: '📜' },
            { name: 'Date/Time', emoji: '📅' },
            { name: 'Arrays/Objects', emoji: '📦' },
            { name: 'Math/Logic', emoji: '🧮' },
            { name: 'Regex', emoji: '🔄' },
            { name: 'Performance', emoji: '⚡' }
        ]
    },
    'security-compliance': {
        description: '🔒 Enterprise-ready automation! Discuss security best practices, compliance requirements, and safe deployment strategies!',
        tags: [
            { name: 'Security', emoji: '🔒' },
            { name: 'GDPR/Privacy', emoji: '🛡️' },
            { name: 'Enterprise', emoji: '🏢' },
            { name: 'Best Practices', emoji: '✅' }
        ]
    },
    'workflow-templates': {
        description: '📋 Share and discover amazing workflow templates! Post your masterpieces and find inspiration from the community!',
        tags: [
            { name: 'Beginner', emoji: '🌱' },
            { name: 'Intermediate', emoji: '🔧' },
            { name: 'Advanced', emoji: '🚀' },
            { name: 'Expert/Pro', emoji: '⭐' },
            { name: 'E-commerce', emoji: '🛒' },
            { name: 'Marketing', emoji: '📈' },
            { name: 'CRM', emoji: '👥' },
            { name: 'Data Processing', emoji: '📊' },
            { name: 'API & Webhooks', emoji: '🔗' },
            { name: 'AI & GPT', emoji: '🤖' }
        ]
    }
};

async function fixForumChannels() {
    console.log('🔧 Starting Forum Channel Conversion...\n');

    if (!process.env.DISCORD_TOKEN) {
        console.error('❌ DISCORD_TOKEN environment variable is required');
        process.exit(1);
    }

    await client.login(process.env.DISCORD_TOKEN);
    
    console.log(`✅ Bot logged in as ${client.user.tag}\n`);

    // Process all guilds
    for (const guild of client.guilds.cache.values()) {
        console.log(`🏢 Processing guild: ${guild.name}`);
        
        // Check if guild supports forum channels
        const hasCommunitySetting = guild.features.includes('COMMUNITY');
        console.log(`   COMMUNITY feature: ${hasCommunitySetting ? '✅ Enabled' : '❌ Disabled'}`);
        
        if (!hasCommunitySetting) {
            console.log('   ⚠️  Server needs COMMUNITY setting enabled in Discord Server Settings > Enable Community\n');
            continue;
        }

        let conversionsAttempted = 0;
        let conversionsSuccessful = 0;

        // Find channels that should be forums
        for (const [channelName, config] of Object.entries(FORUM_CHANNEL_CONFIGS)) {
            const existingChannel = guild.channels.cache.find(ch => 
                ch.name.includes(channelName.replace(/-/g, '')) || 
                ch.name === channelName ||
                ch.name === channelName.replace(/-/g, '')
            );

            if (!existingChannel) {
                console.log(`   📋 Channel '${channelName}' not found, will be created as forum by /setup`);
                continue;
            }

            if (existingChannel.type === ChannelType.GuildForum) {
                console.log(`   ✅ ${existingChannel.name} is already a forum channel`);
                continue;
            }

            if (existingChannel.type !== ChannelType.GuildText) {
                console.log(`   ⚠️  ${existingChannel.name} is ${existingChannel.type}, cannot convert to forum`);
                continue;
            }

            console.log(`   🔄 Converting ${existingChannel.name} to forum channel...`);
            conversionsAttempted++;

            try {
                // Store original channel info
                const originalParent = existingChannel.parent;
                const originalPosition = existingChannel.position;
                const originalPermissions = existingChannel.permissionOverwrites.cache;

                // Delete old text channel
                await existingChannel.delete('Converting to forum channel');
                
                // Wait a moment to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Create new forum channel
                const forumChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildForum,
                    parent: originalParent,
                    topic: config.description,
                    position: originalPosition,
                    permissionOverwrites: Array.from(originalPermissions.values()),
                    availableTags: config.tags.map(tag => ({
                        name: tag.name,
                        emoji: tag.emoji || null,
                        moderated: tag.moderated || false
                    })),
                    reason: 'Converting text channel to forum for better community engagement'
                });

                console.log(`   ✅ Successfully converted ${channelName} to forum (ID: ${forumChannel.id})`);
                conversionsSuccessful++;

                // Wait between conversions to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                console.error(`   ❌ Failed to convert ${channelName}:`, error.message);
                
                if (error.code === 50024) {
                    console.error(`      Discord API Error 50024 - Invalid form body parameters`);
                    console.error(`      This usually means the guild doesn't support forum channels`);
                } else if (error.code === 50013) {
                    console.error(`      Missing permissions to manage channels`);
                } else {
                    console.error(`      Error code: ${error.code}`);
                }
            }
        }

        console.log(`   📊 Conversion Summary: ${conversionsSuccessful}/${conversionsAttempted} successful\n`);
    }

    console.log('🎉 Forum channel conversion completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run /setup in your Discord server to create any missing forum channels');
    console.log('   2. Check that all converted channels have proper tags');
    console.log('   3. If conversions failed, ensure the server has COMMUNITY feature enabled');
    
    process.exit(0);
}

client.once('ready', fixForumChannels);

client.on('error', error => {
    console.error('Discord client error:', error);
    process.exit(1);
});
