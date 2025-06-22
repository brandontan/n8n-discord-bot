const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

// Progress and achievements command
const progressCommand = new SlashCommandBuilder()
    .setName('progress')
    .setDescription('View your community progress, badges, and achievements')
    .addUserOption(option => 
        option.setName('user')
            .setDescription('View another user\'s progress (optional)')
            .setRequired(false));

// Enhanced leaderboard command with gamification
const leaderboardCommand = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View community leaderboards with levels and badges')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Type of leaderboard to view')
            .setRequired(false)
            .addChoices(
                { name: '🤝 Helpfulness', value: 'helpfulness' },
                { name: '💰 Success Stories', value: 'earnings' },
                { name: '🏆 Badges', value: 'badges' }
            ));

// Level info command
const levelInfoCommand = new SlashCommandBuilder()
    .setName('levels')
    .setDescription('View all available levels and requirements')
    .addStringOption(option =>
        option.setName('category')
            .setDescription('Category to view')
            .setRequired(false)
            .addChoices(
                { name: '🤝 Helpfulness Levels', value: 'helpfulness' },
                { name: '💰 Success Levels', value: 'earnings' }
            ));

// Badges showcase command
const badgesCommand = new SlashCommandBuilder()
    .setName('badges')
    .setDescription('View all available badges and your progress')
    .addStringOption(option =>
        option.setName('category')
            .setDescription('Badge category to view')
            .setRequired(false)
            .addChoices(
                { name: '🏆 Achievement Badges', value: 'achievement' },
                { name: '💰 Earning Badges', value: 'earning' },
                { name: '👥 Social Badges', value: 'social' },
                { name: '⭐ Special Badges', value: 'special' }
            ));

// Rewards showcase command
const rewardsCommand = new SlashCommandBuilder()
    .setName('rewards')
    .setDescription('View unlockable features and rewards')
    .addIntegerOption(option =>
        option.setName('level')
            .setDescription('View rewards for a specific level')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(6));

// Award points command (admin only)
const awardPointsCommand = new SlashCommandBuilder()
    .setName('award-points')
    .setDescription('Award helpfulness points to a user (admin only)')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to award points to')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('points')
            .setDescription('Number of points to award')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for awarding points')
            .setRequired(false));

// Level up celebration command
const celebrateCommand = new SlashCommandBuilder()
    .setName('celebrate')
    .setDescription('Celebrate your achievements and level ups!')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('What to celebrate')
            .setRequired(false)
            .addChoices(
                { name: '🎉 Level Up', value: 'levelup' },
                { name: '🏆 New Badge', value: 'badge' },
                { name: '💰 Big Win', value: 'earnings' },
                { name: '🎯 Milestone', value: 'milestone' }
            ));

// Interactive feature discovery command
const discoverCommand = new SlashCommandBuilder()
    .setName('discover')
    .setDescription('Discover new features based on your level and progress');

// Community challenges command
const challengesCommand = new SlashCommandBuilder()
    .setName('challenges')
    .setDescription('View active community challenges and events')
    .addStringOption(option =>
        option.setName('action')
            .setDescription('Challenge action')
            .setRequired(false)
            .addChoices(
                { name: '📋 View Active', value: 'active' },
                { name: '🏆 My Progress', value: 'progress' },
                { name: '🎯 Join Challenge', value: 'join' }
            ));

// Enhanced profile command with gamification
const enhancedProfileCommand = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View or edit your enhanced community profile')
    .addStringOption(option =>
        option.setName('action')
            .setDescription('Profile action')
            .setRequired(false)
            .addChoices(
                { name: '👤 View Profile', value: 'view' },
                { name: '✏️ Edit Profile', value: 'edit' },
                { name: '🎨 Customize Theme', value: 'theme' },
                { name: '🏆 Showcase Badges', value: 'badges' }
            ))
    .addUserOption(option =>
        option.setName('user')
            .setDescription('View another user\'s profile')
            .setRequired(false));

// Weekly progress summary command
const weeklyProgressCommand = new SlashCommandBuilder()
    .setName('weekly-progress')
    .setDescription('View your weekly progress summary and goals');

// Motivation and tips command
const motivationCommand = new SlashCommandBuilder()
    .setName('motivation')
    .setDescription('Get personalized motivation and tips for leveling up');

module.exports = {
    progressCommand,
    leaderboardCommand,
    levelInfoCommand,
    badgesCommand,
    rewardsCommand,
    awardPointsCommand,
    celebrateCommand,
    discoverCommand,
    challengesCommand,
    enhancedProfileCommand,
    weeklyProgressCommand,
    motivationCommand
};
