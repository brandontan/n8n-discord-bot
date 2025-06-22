const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

class OnboardingManager {
    constructor() {
        this.configFile = path.join(__dirname, '../config/onboarding.json');
        this.userDataFile = path.join(__dirname, '../data/onboarding_users.json');
        this.ensureDataFile();
    }

    // Ensure the user data file exists
    ensureDataFile() {
        if (!fs.existsSync(this.userDataFile)) {
            fs.writeFileSync(this.userDataFile, JSON.stringify({ users: {} }, null, 2));
        }
    }

    // Load onboarding configuration
    loadConfig() {
        try {
            const data = fs.readFileSync(this.configFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Onboarding: Error loading config:', error);
            return null;
        }
    }

    // Load user onboarding data
    loadUserData() {
        try {
            const data = fs.readFileSync(this.userDataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Onboarding: Error loading user data:', error);
            return { users: {} };
        }
    }

    // Save user onboarding data
    saveUserData(data) {
        try {
            fs.writeFileSync(this.userDataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Onboarding: Error saving user data:', error);
            return false;
        }
    }

    // Process new member joining
    async handleNewMember(member) {
        const config = this.loadConfig();
        if (!config || !config.onboarding.welcome_screen.enabled) {
            return;
        }

        console.log(`Onboarding: New member joined: ${member.user.tag} in ${member.guild.name}`);
        
        // Initialize user data
        const userData = this.loadUserData();
        userData.users[member.user.id] = {
            username: member.user.username,
            guild_id: member.guild.id,
            joined_at: new Date().toISOString(),
            onboarding_completed: false,
            responses: {},
            assigned_roles: [],
            recommended_channels: []
        };
        
        this.saveUserData(userData);

        // Send welcome DM with onboarding instructions
        await this.sendWelcomeDM(member, config);
    }

    // Send welcome DM to new member
    async sendWelcomeDM(member, config) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🚀 Welcome to the n8n Automation Community!')
                .setDescription(config.onboarding.welcome_screen.description)
                .setColor(0x7289DA)
                .addFields(
                    {
                        name: '📋 Quick Setup',
                        value: 'I\'ll help you get set up with the right roles and channels based on your interests!',
                        inline: false
                    },
                    {
                        name: '🎯 Getting Started',
                        value: config.onboarding.welcome_screen.welcome_channels
                            .map(ch => `${ch.emoji} **#${ch.channel_name}** - ${ch.description}`)
                            .join('\n'),
                        inline: false
                    },
                    {
                        name: '⚡ Next Steps',
                        value: 'Click the button below to start your personalized onboarding! I\'ll ask you a few quick questions to set up your perfect experience.',
                        inline: false
                    }
                )
                .setFooter({ 
                    text: 'Complete onboarding to unlock your personalized experience!',
                    iconURL: member.guild.iconURL()
                })
                .setTimestamp();

            const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
            
            const startButton = new ButtonBuilder()
                .setCustomId(`start_onboarding_${member.user.id}`)
                .setLabel('🚀 Start Onboarding')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(startButton);

            await member.send({ embeds: [embed], components: [row] });
            console.log(`Onboarding: Welcome DM with interactive button sent to ${member.user.tag}`);
        } catch (error) {
            console.error(`Onboarding: Error sending welcome DM to ${member.user.tag}:`, error);
        }
    }

    // Simulate onboarding completion (since Discord onboarding is server-side)
    async completeOnboarding(member, responses) {
        const config = this.loadConfig();
        if (!config) {
            return { success: false, error: 'Config not found' };
        }

        const userData = this.loadUserData();
        if (!userData.users[member.user.id]) {
            userData.users[member.user.id] = {
                username: member.user.username,
                guild_id: member.guild.id,
                joined_at: new Date().toISOString(),
                onboarding_completed: false,
                responses: {},
                assigned_roles: [],
                recommended_channels: []
            };
        }

        // Process responses and determine roles/channels
        const result = this.processOnboardingResponses(member, responses, config);
        
        // Update user data
        userData.users[member.user.id].onboarding_completed = true;
        userData.users[member.user.id].responses = responses;
        userData.users[member.user.id].assigned_roles = result.roles;
        userData.users[member.user.id].recommended_channels = result.channels;
        userData.users[member.user.id].completed_at = new Date().toISOString();
        
        this.saveUserData(userData);

        // Assign roles
        await this.assignRoles(member, result.roles);

        // Send completion messages
        await this.sendCompletionMessages(member, result, config);

        console.log(`Onboarding: Completed for ${member.user.tag} - Roles: ${result.roles.join(', ')}, Channels: ${result.channels.length}`);
        
        return { success: true, ...result };
    }

    // Process onboarding responses to determine roles and channels
    processOnboardingResponses(member, responses, config) {
        const assignedRoles = new Set();
        const recommendedChannels = new Set();

        // Process each response
        for (const [promptId, answer] of Object.entries(responses)) {
            const prompt = config.onboarding.prompts.find(p => p.id === promptId);
            if (!prompt) continue;

            // Handle multiple select vs single select
            const answers = Array.isArray(answer) ? answer : [answer];
            
            for (const answerOption of answers) {
                const option = prompt.options.find(opt => opt.id === answerOption);
                if (!option) continue;

                // Add role if specified
                if (option.role) {
                    assignedRoles.add(option.role);
                }

                // Add recommended channels
                if (option.channels) {
                    option.channels.forEach(channel => recommendedChannels.add(channel));
                }
            }
        }

        return {
            roles: Array.from(assignedRoles),
            channels: Array.from(recommendedChannels),
            responses: responses
        };
    }

    // Assign roles to member
    async assignRoles(member, roleNames) {
        for (const roleName of roleNames) {
            try {
                const role = member.guild.roles.cache.find(r => r.name === roleName);
                if (role && !member.roles.cache.has(role.id)) {
                    await member.roles.add(role, 'Automatic onboarding role assignment');
                    console.log(`Onboarding: Assigned role "${roleName}" to ${member.user.tag}`);
                }
            } catch (error) {
                console.error(`Onboarding: Error assigning role "${roleName}" to ${member.user.tag}:`, error);
            }
        }
    }

    // Send completion messages
    async sendCompletionMessages(member, result, config) {
        const completionConfig = config.onboarding.completion_actions;

        // Send welcome message in introductions channel
        if (completionConfig.welcome_message.enabled) {
            await this.sendWelcomeMessage(member, result, completionConfig.welcome_message);
        }

        // Send private completion DM
        if (completionConfig.private_welcome_dm.enabled) {
            await this.sendCompletionDM(member, result, completionConfig.private_welcome_dm);
        }
    }

    // Send welcome message in public channel
    async sendWelcomeMessage(member, result, messageConfig) {
        try {
            const channel = member.guild.channels.cache.find(ch => ch.name === messageConfig.channel);
            if (!channel) return;

            const message = messageConfig.message_template
                .replace('{{username}}', member.user.toString())
                .replace('{{assigned_role}}', result.roles.join(', ') || 'Community Member')
                .replace('{{recommended_channels}}', result.channels.slice(0, 5).map(ch => `#${ch}`).join(', '));

            await channel.send(message);
            console.log(`Onboarding: Welcome message posted for ${member.user.tag} in #${channel.name}`);
        } catch (error) {
            console.error(`Onboarding: Error sending welcome message for ${member.user.tag}:`, error);
        }
    }

    // Send completion DM
    async sendCompletionDM(member, result, dmConfig) {
        try {
            const message = dmConfig.message_template
                .replace('{{assigned_role}}', result.roles.join(', ') || 'Community Member')
                .replace('{{channel_count}}', result.channels.length.toString());

            const embed = new EmbedBuilder()
                .setTitle('🎉 Onboarding Complete!')
                .setDescription(message)
                .setColor(0x00FF00)
                .addFields(
                    {
                        name: '🎯 Your Personalized Channels',
                        value: result.channels.length > 0 
                            ? result.channels.slice(0, 10).map(ch => `• #${ch}`).join('\n')
                            : 'Access all community channels!',
                        inline: false
                    }
                )
                .setFooter({ 
                    text: 'Start exploring your new automation community!',
                    iconURL: member.guild.iconURL()
                })
                .setTimestamp();

            await member.send({ embeds: [embed] });
            console.log(`Onboarding: Completion DM sent to ${member.user.tag}`);
        } catch (error) {
            console.error(`Onboarding: Error sending completion DM to ${member.user.tag}:`, error);
        }
    }

    // Get user onboarding status
    getUserStatus(userId) {
        const userData = this.loadUserData();
        return userData.users[userId] || null;
    }

    // Get onboarding statistics
    getOnboardingStats(guildId) {
        const userData = this.loadUserData();
        const guildUsers = Object.values(userData.users).filter(user => user.guild_id === guildId);
        
        const completed = guildUsers.filter(user => user.onboarding_completed).length;
        const total = guildUsers.length;
        
        // Role distribution
        const roleDistribution = {};
        guildUsers.forEach(user => {
            user.assigned_roles.forEach(role => {
                roleDistribution[role] = (roleDistribution[role] || 0) + 1;
            });
        });

        // Most popular channels
        const channelPopularity = {};
        guildUsers.forEach(user => {
            user.recommended_channels.forEach(channel => {
                channelPopularity[channel] = (channelPopularity[channel] || 0) + 1;
            });
        });

        return {
            total_users: total,
            completed_onboarding: completed,
            completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
            role_distribution: roleDistribution,
            popular_channels: Object.entries(channelPopularity)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([channel, count]) => ({ channel, count }))
        };
    }

    // Manual onboarding trigger for testing
    async triggerManualOnboarding(member, responses) {
        console.log(`Onboarding: Manual trigger for ${member.user.tag}`);
        return await this.completeOnboarding(member, responses);
    }

    // Handle button interaction to start onboarding
    async handleStartOnboarding(interaction) {
        console.log(`Onboarding: Starting interactive flow for ${interaction.user.tag}`);
        
        const config = this.loadConfig();
        if (!config) {
            await interaction.reply({
                content: '❌ Onboarding configuration not found.',
                ephemeral: true
            });
            return;
        }

        // Initialize or get user data
        const userData = this.loadUserData();
        if (!userData.users[interaction.user.id]) {
            userData.users[interaction.user.id] = {
                username: interaction.user.username,
                guild_id: interaction.guild?.id || 'dm',
                joined_at: new Date().toISOString(),
                onboarding_completed: false,
                onboarding_step: 0,
                responses: {},
                assigned_roles: [],
                recommended_channels: []
            };
        }

        // Reset onboarding progress
        userData.users[interaction.user.id].onboarding_step = 0;
        userData.users[interaction.user.id].responses = {};
        userData.users[interaction.user.id].onboarding_completed = false;
        
        this.saveUserData(userData);

        // Start with first question
        await this.askQuestion(interaction, 0, config);
    }

    // Ask a specific question in the onboarding flow
    async askQuestion(interaction, questionIndex, config) {
        const prompts = config.onboarding.prompts;
        
        if (questionIndex >= prompts.length) {
            // All questions completed, process onboarding
            await this.finishInteractiveOnboarding(interaction);
            return;
        }

        const prompt = prompts[questionIndex];
        const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

        const embed = new EmbedBuilder()
            .setTitle(`🎯 Question ${questionIndex + 1} of ${prompts.length}`)
            .setDescription(`**${prompt.title}**`)
            .setColor(0x7289DA)
            .setFooter({ 
                text: `Step ${questionIndex + 1}/${prompts.length} • Complete all questions to unlock your personalized experience!`
            });

        let components = [];

        if (prompt.type === 'multiple_choice') {
            if (prompt.multiple_select) {
                // Multi-select with buttons
                const buttons = prompt.options.map(option => {
                    return new ButtonBuilder()
                        .setCustomId(`onboard_multi_${questionIndex}_${option.id}_${interaction.user.id}`)
                        .setLabel(`${option.emoji} ${option.title}`)
                        .setStyle(ButtonStyle.Secondary);
                });

                // Split into rows (max 5 buttons per row)
                const rows = [];
                for (let i = 0; i < buttons.length; i += 5) {
                    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
                }

                // Add continue button
                const continueButton = new ButtonBuilder()
                    .setCustomId(`onboard_continue_${questionIndex}_${interaction.user.id}`)
                    .setLabel('✅ Continue')
                    .setStyle(ButtonStyle.Primary);

                const skipButton = new ButtonBuilder()
                    .setCustomId(`onboard_skip_${questionIndex}_${interaction.user.id}`)
                    .setLabel('⏭️ Skip')
                    .setStyle(ButtonStyle.Secondary);

                rows.push(new ActionRowBuilder().addComponents([continueButton, skipButton]));
                components = rows;

                embed.addFields({
                    name: '📝 Instructions',
                    value: 'Select all that apply, then click **Continue** when done. You can also skip this question.',
                    inline: false
                });

            } else {
                // Single select dropdown
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`onboard_select_${questionIndex}_${interaction.user.id}`)
                    .setPlaceholder('Choose an option...')
                    .addOptions(
                        prompt.options.map(option => 
                            new StringSelectMenuOptionBuilder()
                                .setLabel(option.title)
                                .setDescription(option.description)
                                .setValue(option.id)
                                .setEmoji(option.emoji)
                        )
                    );

                components = [new ActionRowBuilder().addComponents(selectMenu)];
            }
        }

        const messageOptions = { embeds: [embed], components, ephemeral: true };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(messageOptions);
        } else {
            await interaction.reply(messageOptions);
        }
    }

    // Handle question responses
    async handleQuestionResponse(interaction, questionIndex, selectedValues) {
        const userData = this.loadUserData();
        const userRecord = userData.users[interaction.user.id];
        
        if (!userRecord) {
            await interaction.reply({
                content: '❌ Onboarding session not found. Please start over.',
                ephemeral: true
            });
            return;
        }

        const config = this.loadConfig();
        const prompt = config.onboarding.prompts[questionIndex];
        
        // Store the response
        userRecord.responses[prompt.id] = selectedValues;
        userRecord.onboarding_step = questionIndex + 1;
        
        this.saveUserData(userData);

        // Move to next question
        await this.askQuestion(interaction, questionIndex + 1, config);
    }

    // Finish interactive onboarding
    async finishInteractiveOnboarding(interaction) {
        const userData = this.loadUserData();
        const userRecord = userData.users[interaction.user.id];
        
        if (!userRecord || !userRecord.responses) {
            await interaction.reply({
                content: '❌ No onboarding responses found.',
                ephemeral: true
            });
            return;
        }

        // Get member object (needed for role assignment)
        let member;
        if (interaction.guild) {
            member = await interaction.guild.members.fetch(interaction.user.id);
        } else {
            // In DM, we can't assign roles, but we can still complete the process
            await interaction.reply({
                content: '✅ **Onboarding Complete!** \n\nJoin a server with this bot to get role assignments and channel access.',
                ephemeral: true
            });
            return;
        }

        const config = this.loadConfig();
        const result = this.processOnboardingResponses(member, userRecord.responses, config);
        
        // Update user data
        userRecord.onboarding_completed = true;
        userRecord.assigned_roles = result.roles;
        userRecord.recommended_channels = result.channels;
        userRecord.completed_at = new Date().toISOString();
        
        this.saveUserData(userData);

        // Assign roles
        await this.assignRoles(member, result.roles);

        // Send completion message
        const embed = new EmbedBuilder()
            .setTitle('🎉 Onboarding Complete!')
            .setDescription('Your personalized Discord experience is now set up!')
            .setColor(0x00FF00)
            .addFields(
                {
                    name: '🎭 Assigned Roles',
                    value: result.roles.length > 0 ? result.roles.join(', ') : 'Community Member',
                    inline: false
                },
                {
                    name: '📺 Recommended Channels',
                    value: result.channels.length > 0 
                        ? result.channels.slice(0, 10).map(ch => `#${ch}`).join(', ')
                        : 'Access all community channels!',
                    inline: false
                },
                {
                    name: '🚀 Next Steps',
                    value: '• Check out your recommended channels\n• Update your profile with your automation skills\n• Start connecting with the community!',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Welcome to the n8n automation community!',
                iconURL: member.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        // Send completion messages in public channels
        await this.sendCompletionMessages(member, result, config);

        console.log(`Onboarding: Interactive flow completed for ${member.user.tag} - Roles: ${result.roles.join(', ')}, Channels: ${result.channels.length}`);
    }

    // Handle multi-select button toggles
    async handleMultiSelectToggle(interaction, questionIndex, optionId) {
        const userData = this.loadUserData();
        const userRecord = userData.users[interaction.user.id];
        
        if (!userRecord) {
            await interaction.reply({
                content: '❌ Onboarding session not found.',
                ephemeral: true
            });
            return;
        }

        const config = this.loadConfig();
        const prompt = config.onboarding.prompts[questionIndex];
        
        // Initialize responses for this question if not exists
        if (!userRecord.responses[prompt.id]) {
            userRecord.responses[prompt.id] = [];
        }

        // Toggle the option
        const currentSelections = userRecord.responses[prompt.id];
        const index = currentSelections.indexOf(optionId);
        
        if (index > -1) {
            currentSelections.splice(index, 1); // Remove
        } else {
            currentSelections.push(optionId); // Add
        }

        this.saveUserData(userData);

        // Update the message to show current selections
        const selectedOptions = prompt.options.filter(opt => currentSelections.includes(opt.id));
        const selectionText = selectedOptions.length > 0 
            ? `**Selected:** ${selectedOptions.map(opt => opt.emoji + ' ' + opt.title).join(', ')}`
            : '**No selections yet**';

        const embed = new EmbedBuilder()
            .setTitle(`🎯 Question ${questionIndex + 1} of ${config.onboarding.prompts.length}`)
            .setDescription(`**${prompt.title}**\n\n${selectionText}`)
            .setColor(0x7289DA)
            .setFooter({ 
                text: `Step ${questionIndex + 1}/${config.onboarding.prompts.length} • Click options to toggle selection`
            });

        embed.addFields({
            name: '📝 Instructions',
            value: 'Select all that apply, then click **Continue** when done. You can also skip this question.',
            inline: false
        });

        await interaction.update({ embeds: [embed] });
    }
}

module.exports = OnboardingManager;
