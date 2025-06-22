const { SlashCommandBuilder } = require('discord.js');

// Test Spotlight Command - manually trigger a spotlight post
const testSpotlightCommand = new SlashCommandBuilder()
    .setName('test-spotlight')
    .setDescription('Manually trigger a test weekly spotlight post')
    .setDefaultMemberPermissions(32n); // Manage Messages permission

// Spotlight Status Command - check spotlight automation status
const spotlightStatusCommand = new SlashCommandBuilder()
    .setName('spotlight-status')
    .setDescription('Check the status of the weekly spotlight automation')
    .setDefaultMemberPermissions(32n); // Manage Messages permission

// Spotlight Config Command - configure spotlight settings
const spotlightConfigCommand = new SlashCommandBuilder()
    .setName('spotlight-config')
    .setDescription('Configure weekly spotlight automation settings')
    .setDefaultMemberPermissions(8n) // Administrator permission
    .addSubcommand(subcommand =>
        subcommand
            .setName('enable-n8n')
            .setDescription('Enable n8n webhook integration for spotlight content')
            .addStringOption(option =>
                option
                    .setName('webhook-url')
                    .setDescription('n8n webhook URL for fetching spotlight content')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('enable-gsheets')
            .setDescription('Enable Google Sheets integration for spotlight content')
            .addStringOption(option =>
                option
                    .setName('sheet-url')
                    .setDescription('Google Sheets URL (must be publicly accessible)')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('disable-external')
            .setDescription('Disable external integrations and use only local spotlight data')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('set-max-pins')
            .setDescription('Set maximum number of pinned spotlight messages')
            .addIntegerOption(option =>
                option
                    .setName('count')
                    .setDescription('Maximum pinned messages (1-10)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(10)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('view')
            .setDescription('View current spotlight configuration')
    );

// Spotlight Control Command - start/stop the automation
const spotlightControlCommand = new SlashCommandBuilder()
    .setName('spotlight-control')
    .setDescription('Control the weekly spotlight automation')
    .setDefaultMemberPermissions(8n) // Administrator permission
    .addSubcommand(subcommand =>
        subcommand
            .setName('start')
            .setDescription('Start the weekly spotlight automation')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('stop')
            .setDescription('Stop the weekly spotlight automation')
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('restart')
            .setDescription('Restart the weekly spotlight automation')
    );

module.exports = {
    testSpotlightCommand,
    spotlightStatusCommand,
    spotlightConfigCommand,
    spotlightControlCommand
};
