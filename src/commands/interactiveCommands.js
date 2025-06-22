const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// Reaction Role System Command
const reactionRoleCommand = new SlashCommandBuilder()
    .setName('reaction-roles')
    .setDescription('Create interactive reaction role messages')
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('Create a reaction role message')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('Channel to post the reaction role message')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('title')
                    .setDescription('Title for the reaction role embed')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('Description for the reaction role embed')
                    .setRequired(true)));

// Community Poll Command
const pollCommand = new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create an interactive community poll')
    .addStringOption(option =>
        option.setName('question')
            .setDescription('The poll question')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('options')
            .setDescription('Poll options separated by commas (max 10)')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('duration')
            .setDescription('Poll duration in hours (default: 24)')
            .setMinValue(1)
            .setMaxValue(168)
            .setRequired(false))
    .addBooleanOption(option =>
        option.setName('anonymous')
            .setDescription('Hide who voted for what (default: false)')
            .setRequired(false));

// Skill Assessment Command
const skillAssessmentCommand = new SlashCommandBuilder()
    .setName('skill-assessment')
    .setDescription('Take an n8n skill assessment to get appropriate roles')
    .addStringOption(option =>
        option.setName('category')
            .setDescription('Which skill category to assess')
            .setRequired(true)
            .addChoices(
                { name: '🔗 API Integration', value: 'api' },
                { name: '📊 Data Processing', value: 'data' },
                { name: '🤖 AI & Machine Learning', value: 'ai' },
                { name: '🛒 E-commerce Automation', value: 'ecommerce' },
                { name: '📈 Marketing Automation', value: 'marketing' }
            ));

// Auto-Moderation Setup Command
const autoModCommand = new SlashCommandBuilder()
    .setName('auto-mod')
    .setDescription('Configure automatic moderation features (admin only)')
    .addSubcommand(subcommand =>
        subcommand
            .setName('setup')
            .setDescription('Setup auto-moderation rules')
            .addBooleanOption(option =>
                option.setName('spam-detection')
                    .setDescription('Enable spam detection')
                    .setRequired(true))
            .addBooleanOption(option =>
                option.setName('link-filtering')
                    .setDescription('Filter suspicious links')
                    .setRequired(true))
            .addBooleanOption(option =>
                option.setName('caps-filter')
                    .setDescription('Filter excessive caps')
                    .setRequired(true)));

// Interactive Help Command
const interactiveHelpCommand = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Interactive help system with categories')
    .addStringOption(option =>
        option.setName('category')
            .setDescription('Help category')
            .setRequired(false)
            .addChoices(
                { name: '🚀 Getting Started', value: 'getting-started' },
                { name: '💼 Finding Work', value: 'finding-work' },
                { name: '👥 Hiring Talent', value: 'hiring' },
                { name: '🔧 Technical Help', value: 'technical' },
                { name: '🎯 Forum Features', value: 'forums' },
                { name: '⭐ Advanced Features', value: 'advanced' }
            ));

// Channel Activity Command
const activityCommand = new SlashCommandBuilder()
    .setName('activity')
    .setDescription('View channel activity and stats')
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel to analyze (optional)')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('timeframe')
            .setDescription('Time period to analyze')
            .setRequired(false)
            .addChoices(
                { name: 'Last 24 hours', value: '24h' },
                { name: 'Last 7 days', value: '7d' },
                { name: 'Last 30 days', value: '30d' }
            ));

// User Profile Command
const profileCommand = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View or edit your community profile')
    .addSubcommand(subcommand =>
        subcommand
            .setName('view')
            .setDescription('View a user profile')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('User to view (optional, defaults to you)')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('edit')
            .setDescription('Edit your profile with interactive form'));

// Leaderboard Command (Community Focus)
const leaderboardCommand = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View community leaderboards')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Leaderboard type')
            .setRequired(true)
            .addChoices(
                { name: '💬 Most Active Contributors', value: 'messages' },
                { name: '🆘 Most Helpful (Solved Tags)', value: 'helpful' },
                { name: '📋 Most Shared Templates', value: 'templates' },
                { name: '🎯 Best Solutions', value: 'solutions' },
                { name: '⭐ Rising Stars (New Contributors)', value: 'rising' },
                { name: '🔥 Weekly Champions', value: 'weekly' }
            ));

// Financial Dashboard Command
const moneyCommand = new SlashCommandBuilder()
    .setName('money')
    .setDescription('Financial dashboard and earnings tracking')
    .addSubcommand(subcommand =>
        subcommand
            .setName('dashboard')
            .setDescription('View your financial dashboard'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('update')
            .setDescription('Update your financial data')
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('What to update')
                    .setRequired(true)
                    .addChoices(
                        { name: '💰 Monthly Revenue', value: 'revenue' },
                        { name: '📊 Completed Projects', value: 'projects' },
                        { name: '💵 Hourly Rate', value: 'rate' },
                        { name: '🎯 Goals & Targets', value: 'goals' }
                    ))
            .addNumberOption(option =>
                option.setName('amount')
                    .setDescription('Amount/number to set')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('project')
            .setDescription('Log a completed project')
            .addStringOption(option =>
                option.setName('title')
                    .setDescription('Project title')
                    .setRequired(true))
            .addNumberOption(option =>
                option.setName('value')
                    .setDescription('Project value (USD)')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('client')
                    .setDescription('Client name (optional)')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('leaderboard')
            .setDescription('View financial leaderboards')
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('Leaderboard type')
                    .setRequired(false)
                    .addChoices(
                        { name: '📈 Top Earners (This Month)', value: 'monthly' },
                        { name: '🚀 Biggest Growth', value: 'growth' },
                        { name: '⚡ Most Projects', value: 'projects' },
                        { name: '💎 Highest Rates', value: 'rates' },
                        { name: '🏆 Annual Champions', value: 'annual' }
                    )))
    .addSubcommand(subcommand =>
        subcommand
            .setName('privacy')
            .setDescription('Configure your privacy settings')
            .addBooleanOption(option =>
                option.setName('show-revenue')
                    .setDescription('Show revenue in leaderboards')
                    .setRequired(false))
            .addBooleanOption(option =>
                option.setName('show-projects')
                    .setDescription('Show project count')
                    .setRequired(false))
            .addBooleanOption(option =>
                option.setName('show-rate')
                    .setDescription('Show hourly rate')
                    .setRequired(false))
            .addBooleanOption(option =>
                option.setName('anonymous-only')
                    .setDescription('Only show anonymous rankings')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('stats')
            .setDescription('View community financial statistics'));

// Enhanced Profile Command with Financial Data
const enhancedProfileCommand = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View or edit your community profile')
    .addSubcommand(subcommand =>
        subcommand
            .setName('view')
            .setDescription('View a user profile')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('User to view (optional, defaults to you)')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('edit')
            .setDescription('Edit your profile with interactive form'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('showcase')
            .setDescription('Add a project showcase')
            .addStringOption(option =>
                option.setName('title')
                    .setDescription('Project title')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('Project description')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('link')
                    .setDescription('Project link or demo')
                    .setRequired(false)))

module.exports = {
    reactionRoleCommand,
    pollCommand,
    skillAssessmentCommand,
    autoModCommand,
    interactiveHelpCommand,
    activityCommand,
    profileCommand: enhancedProfileCommand,
    leaderboardCommand,
    moneyCommand
};
