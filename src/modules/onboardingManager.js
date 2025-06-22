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
                .setTitle('🚀 Welcome to n8n Professional Network!')
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
                        value: '1. Answer a few quick questions in the server\n2. Get personalized role and channel access\n3. Start connecting with the automation community!',
                        inline: false
                    }
                )
                .setFooter({ 
                    text: 'Complete onboarding in the server to unlock your personalized experience!',
                    iconURL: member.guild.iconURL()
                })
                .setTimestamp();

            await member.send({ embeds: [embed] });
            console.log(`Onboarding: Welcome DM sent to ${member.user.tag}`);
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
}

module.exports = OnboardingManager;
