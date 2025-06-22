const { SlashCommandBuilder } = require('discord.js');

// Manual onboarding command for testing
const manualOnboardingCommand = new SlashCommandBuilder()
    .setName('onboard')
    .setDescription('Manually complete onboarding with your preferences')
    .addStringOption(option =>
        option.setName('user-type')
            .setDescription('What best describes you?')
            .setRequired(true)
            .addChoices(
                { name: '🛠️ Freelancer - I offer automation services', value: 'freelancer' },
                { name: '📦 Client - I need automation solutions', value: 'client' },
                { name: '🎓 Learning - I\'m learning automation', value: 'learner' },
                { name: '🏢 Agency - I run an automation agency', value: 'agency' }
            ))
    .addStringOption(option =>
        option.setName('interests')
            .setDescription('Your automation interests (comma-separated)')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('experience')
            .setDescription('Your n8n experience level')
            .setRequired(false)
            .addChoices(
                { name: '🌱 Beginner - New to n8n', value: 'beginner' },
                { name: '🔧 Intermediate - Some experience', value: 'intermediate' },
                { name: '🚀 Advanced - Complex workflows', value: 'advanced' },
                { name: '⭐ Expert - Professional consultant', value: 'expert' }
            ))
    .addStringOption(option =>
        option.setName('goals')
            .setDescription('Your main goals here (comma-separated)')
            .setRequired(false));

// Onboarding status command
const onboardingStatusCommand = new SlashCommandBuilder()
    .setName('onboarding-status')
    .setDescription('Check your onboarding status and recommendations')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('Check another user\'s onboarding status (admin only)')
            .setRequired(false));

// Onboarding stats command
const onboardingStatsCommand = new SlashCommandBuilder()
    .setName('onboarding-stats')
    .setDescription('View server onboarding statistics (admin only)');

// Re-onboard command
const reOnboardCommand = new SlashCommandBuilder()
    .setName('re-onboard')
    .setDescription('Restart your onboarding process to update preferences');

// Welcome message test command
const testWelcomeCommand = new SlashCommandBuilder()
    .setName('test-welcome')
    .setDescription('Test the welcome message system (admin only)')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to send test welcome message to')
            .setRequired(true));

// Interactive onboarding test command
const testInteractiveCommand = new SlashCommandBuilder()
    .setName('test-interactive')
    .setDescription('Test the interactive onboarding questions (admin only)');

// Create welcome interactive message command
const createWelcomeCommand = new SlashCommandBuilder()
    .setName('create-welcome-interactive')
    .setDescription('Create interactive welcome message with buttons in #start-here (admin only)');

module.exports = {
    manualOnboardingCommand,
    onboardingStatusCommand,
    onboardingStatsCommand,
    reOnboardCommand,
    testWelcomeCommand,
    testInteractiveCommand,
    createWelcomeCommand
};
