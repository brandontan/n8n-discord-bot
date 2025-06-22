const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

// 🎰 VEGAS-STYLE FAQ COMMAND
const faqCommand = new SlashCommandBuilder()
    .setName('faq')
    .setDescription('🎰 n8n Vegas Convention Center FAQ - Your guide to automation stardom!')
    .addStringOption(option =>
        option.setName('topic')
            .setDescription('Choose your adventure!')
            .setRequired(false)
            .addChoices(
                { name: '💰 Money System - Track your automation empire!', value: 'money' },
                { name: '🏆 Leaderboards - Climb to automation fame!', value: 'leaderboards' },
                { name: '🎯 Roles & Badges - Unlock your professional status!', value: 'roles' },
                { name: '🎪 Interactive Features - All the bells and whistles!', value: 'interactive' },
                { name: '🚀 Getting Started - Your automation journey begins!', value: 'getting-started' },
                { name: '💼 Marketplace Magic - Find work, hire talent!', value: 'marketplace' },
                { name: '🎮 Fun Commands - Easter eggs and surprises!', value: 'fun' }
            ));

// 🎯 SIGNBOARD COMMAND
const signboardCommand = new SlashCommandBuilder()
    .setName('signboard')
    .setDescription('🪧 Interactive signboards throughout the n8n Convention Center!')
    .addStringOption(option =>
        option.setName('location')
            .setDescription('Which signboard do you want to read?')
            .setRequired(false)
            .addChoices(
                { name: '🎰 Main Lobby - Welcome to Vegas!', value: 'lobby' },
                { name: '💰 Money Counter - Financial tracking station', value: 'money-counter' },
                { name: '🏆 Hall of Fame - Leaderboard central', value: 'hall-of-fame' },
                { name: '🎪 Feature Theater - Interactive commands showcase', value: 'feature-theater' },
                { name: '📊 Analytics Dashboard - Community stats', value: 'analytics' },
                { name: '🎮 Game Zone - Fun commands and mini-games', value: 'game-zone' }
            ));

// 🎮 FUN COMMANDS SHOWCASE
const showcaseCommand = new SlashCommandBuilder()
    .setName('showcase')
    .setDescription('🎪 Experience ALL the amazing features of n8n Vegas!')
    .addStringOption(option =>
        option.setName('demo')
            .setDescription('Which feature demo do you want?')
            .setRequired(false)
            .addChoices(
                { name: '💰 Money Dashboard Demo', value: 'money-demo' },
                { name: '🏆 Leaderboard Tour', value: 'leaderboard-demo' },
                { name: '👤 Profile Showcase', value: 'profile-demo' },
                { name: '🎯 Complete Feature Tour', value: 'full-tour' }
            ));

// 🎲 RANDOM AUTOMATION TIP
const tipCommand = new SlashCommandBuilder()
    .setName('tip')
    .setDescription('🎲 Get a random automation tip from the Vegas wisdom vault!');

// 🎰 SLOT MACHINE COMMAND (just for fun!)
const slotCommand = new SlashCommandBuilder()
    .setName('slots')
    .setDescription('🎰 Try your luck at the n8n automation slot machine!');

// 🃏 MAGIC 8-BALL FOR AUTOMATION DECISIONS
const eightBallCommand = new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('🔮 Ask the automation oracle for wisdom!')
    .addStringOption(option =>
        option.setName('question')
            .setDescription('Ask about your automation project!')
            .setRequired(true));

// 🎊 CELEBRATION COMMAND
const celebrateCommand = new SlashCommandBuilder()
    .setName('celebrate')
    .setDescription('🎊 Celebrate automation wins with Vegas-style fanfare!')
    .addStringOption(option =>
        option.setName('achievement')
            .setDescription('What are you celebrating?')
            .setRequired(false));

// 🎵 MOOD COMMAND
const moodCommand = new SlashCommandBuilder()
    .setName('mood')
    .setDescription('🎵 Set the Vegas vibe with automation mood lighting!')
    .addStringOption(option =>
        option.setName('vibe')
            .setDescription('What mood are you in?')
            .setRequired(false)
            .addChoices(
                { name: '🔥 Fire - Ready to automate everything!', value: 'fire' },
                { name: '💎 Diamond - Feeling luxurious and premium', value: 'diamond' },
                { name: '🌟 Stellar - On top of the automation world', value: 'stellar' },
                { name: '⚡ Electric - Buzzing with energy', value: 'electric' },
                { name: '🎯 Focused - In the automation zone', value: 'focused' },
                { name: '🎪 Playful - Ready for fun and games', value: 'playful' }
            ));

module.exports = {
    faqCommand,
    signboardCommand,
    showcaseCommand,
    tipCommand,
    slotCommand,
    eightBallCommand,
    celebrateCommand,
    moodCommand
};
