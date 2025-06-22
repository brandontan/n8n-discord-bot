const { SlashCommandBuilder } = require('discord.js');

/**
 * Command to list all channels created by the bot
 */
const listChannelsCommand = new SlashCommandBuilder()
    .setName('list-channels')
    .setDescription('List all n8n Discord channels and categories');

/**
 * Command to get channel information
 */
const channelInfoCommand = new SlashCommandBuilder()
    .setName('channel-info')
    .setDescription('Get information about a specific channel')
    .addStringOption(option =>
        option.setName('channel')
            .setDescription('Channel name to get information for')
            .setRequired(true)
            .setAutocomplete(true)
    );

/**
 * Command to sync channel permissions based on blueprint
 */
const syncChannelPermissionsCommand = new SlashCommandBuilder()
    .setName('sync-channel-permissions')
    .setDescription('Sync channel permissions based on current blueprint configuration');

/**
 * Command to start an interview session with a candidate
 */
const interviewCommand = new SlashCommandBuilder()
    .setName('interview')
    .setDescription('Manage interview sessions')
    .addSubcommand(subcommand =>
        subcommand
            .setName('start')
            .setDescription('Start a new interview session with a candidate')
            .addUserOption(option =>
                option.setName('candidate')
                    .setDescription('The candidate to interview')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('duration')
                    .setDescription('Auto-delete channel after X days (optional, default: 7)')
                    .setMinValue(1)
                    .setMaxValue(30)
                    .setRequired(false)
            )
    );

module.exports = {
    listChannelsCommand,
    channelInfoCommand,
    syncChannelPermissionsCommand,
    interviewCommand
};
