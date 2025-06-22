const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Command to assign roles to users
const assignRoleCommand = new SlashCommandBuilder()
    .setName('assign-role')
    .setDescription('Assign a workflow role to a user')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to assign the role to')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('role')
            .setDescription('The role to assign')
            .setRequired(true)
            .addChoices(
                { name: 'n8n Developer', value: 'n8n Developer' },
                { name: 'Pro Builder', value: 'Pro Builder' },
                { name: 'Workflow Reviewer', value: 'Workflow Reviewer' },
                { name: 'Bot Manager', value: 'Bot Manager' }
            ))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

// Command to remove roles from users
const removeRoleCommand = new SlashCommandBuilder()
    .setName('remove-role')
    .setDescription('Remove a workflow role from a user')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to remove the role from')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('role')
            .setDescription('The role to remove')
            .setRequired(true)
            .addChoices(
                { name: 'n8n Developer', value: 'n8n Developer' },
                { name: 'Pro Builder', value: 'Pro Builder' },
                { name: 'Workflow Reviewer', value: 'Workflow Reviewer' },
                { name: 'Bot Manager', value: 'Bot Manager' }
            ))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

// Command to list all managed roles
const listRolesCommand = new SlashCommandBuilder()
    .setName('list-roles')
    .setDescription('List all n8n workflow roles and their members');

// Command to assign Pro Builder role automatically
const syncProBuilderCommand = new SlashCommandBuilder()
    .setName('sync-pro-builder')
    .setDescription('Sync Pro Builder roles with n8n Pro Builder tags')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

module.exports = {
    assignRoleCommand,
    removeRoleCommand,
    listRolesCommand,
    syncProBuilderCommand
};
