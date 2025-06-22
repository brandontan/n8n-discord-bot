const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class InteractiveHandler {
    constructor() {
        this.dataPath = path.join(__dirname, '..', 'data');
        this.ensureDataDirectory();
    }

    async ensureDataDirectory() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
        } catch (error) {
            console.error('Error creating data directory:', error);
        }
    }

    // Financial Dashboard Handlers
    async handleMoneyCommand(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'dashboard':
                await this.showFinancialDashboard(interaction);
                break;
            case 'update':
                await this.updateFinancialData(interaction);
                break;
            case 'project':
                await this.logProject(interaction);
                break;
            case 'leaderboard':
                await this.showFinancialLeaderboard(interaction);
                break;
            case 'privacy':
                await this.updatePrivacySettings(interaction);
                break;
            case 'stats':
                await this.showCommunityStats(interaction);
                break;
        }
    }

    async showFinancialDashboard(interaction) {
        const userId = interaction.user.id;
        const userData = await this.getUserFinancialData(userId);

        const embed = new EmbedBuilder()
            .setTitle(`💰 ${interaction.user.displayName}'s Financial Dashboard`)
            .setColor('#00ff00')
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields([
                {
                    name: '📊 This Month',
                    value: `**Revenue:** $${userData.monthlyRevenue?.toLocaleString() || '0'}\n**Projects:** ${userData.monthlyProjects || 0}\n**Goal Progress:** ${userData.goalProgress || 0}%`,
                    inline: true
                },
                {
                    name: '🎯 Targets & Goals',
                    value: `**Monthly Goal:** $${userData.monthlyGoal?.toLocaleString() || 'Not Set'}\n**Annual Goal:** $${userData.annualGoal?.toLocaleString() || 'Not Set'}\n**Rate:** $${userData.hourlyRate || 'Not Set'}/hr`,
                    inline: true
                },
                {
                    name: '📈 All-Time Stats',
                    value: `**Total Revenue:** $${userData.totalRevenue?.toLocaleString() || '0'}\n**Total Projects:** ${userData.totalProjects || 0}\n**Best Month:** $${userData.bestMonth?.toLocaleString() || '0'}`,
                    inline: true
                }
            ])
            .setFooter({ text: 'Use /money update to add your latest earnings!' })
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('money_quick_update')
                    .setLabel('Quick Update')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚡'),
                new ButtonBuilder()
                    .setCustomId('money_add_project')
                    .setLabel('Add Project')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📋'),
                new ButtonBuilder()
                    .setCustomId('money_set_goals')
                    .setLabel('Set Goals')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎯')
            );

        await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    }

    async updateFinancialData(interaction) {
        const type = interaction.options.getString('type');
        const amount = interaction.options.getNumber('amount');
        const userId = interaction.user.id;

        const userData = await this.getUserFinancialData(userId);
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        switch (type) {
            case 'revenue':
                userData.monthlyRevenue = amount;
                userData.totalRevenue = (userData.totalRevenue || 0) + amount;
                userData.revenueHistory = userData.revenueHistory || {};
                userData.revenueHistory[currentMonth] = amount;
                break;
            case 'projects':
                userData.monthlyProjects = amount;
                userData.totalProjects = (userData.totalProjects || 0) + amount;
                break;
            case 'rate':
                userData.hourlyRate = amount;
                break;
            case 'goals':
                userData.monthlyGoal = amount;
                break;
        }

        await this.saveUserFinancialData(userId, userData);

        const embed = new EmbedBuilder()
            .setTitle('✅ Financial Data Updated!')
            .setColor('#00ff00')
            .setDescription(`Successfully updated your ${type}: **$${amount.toLocaleString()}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async logProject(interaction) {
        const title = interaction.options.getString('title');
        const value = interaction.options.getNumber('value');
        const client = interaction.options.getString('client') || 'Private Client';
        const userId = interaction.user.id;

        const userData = await this.getUserFinancialData(userId);
        userData.projects = userData.projects || [];
        userData.projects.push({
            title,
            value,
            client,
            date: new Date().toISOString(),
            month: new Date().toISOString().slice(0, 7)
        });

        userData.totalProjects = (userData.totalProjects || 0) + 1;
        userData.totalRevenue = (userData.totalRevenue || 0) + value;
        userData.monthlyProjects = (userData.monthlyProjects || 0) + 1;
        userData.monthlyRevenue = (userData.monthlyRevenue || 0) + value;

        await this.saveUserFinancialData(userId, userData);

        const embed = new EmbedBuilder()
            .setTitle('🎉 Project Logged Successfully!')
            .setColor('#00ff00')
            .addFields([
                { name: '📋 Project', value: title, inline: true },
                { name: '💰 Value', value: `$${value.toLocaleString()}`, inline: true },
                { name: '👤 Client', value: client, inline: true }
            ])
            .setFooter({ text: 'Great work! Keep building your portfolio!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async showFinancialLeaderboard(interaction) {
        const type = interaction.options.getString('type') || 'monthly';
        const allUsers = await this.getAllFinancialData();

        let leaderboard = [];
        const currentMonth = new Date().toISOString().slice(0, 7);

        switch (type) {
            case 'monthly':
                leaderboard = Object.entries(allUsers)
                    .map(([userId, data]) => ({
                        userId,
                        value: data.monthlyRevenue || 0,
                        displayName: data.displayName || 'Anonymous'
                    }))
                    .filter(user => user.value > 0)
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10);
                break;
            case 'projects':
                leaderboard = Object.entries(allUsers)
                    .map(([userId, data]) => ({
                        userId,
                        value: data.totalProjects || 0,
                        displayName: data.displayName || 'Anonymous'
                    }))
                    .filter(user => user.value > 0)
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10);
                break;
            // Add more leaderboard types...
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏆 Financial Leaderboard - ${type.charAt(0).toUpperCase() + type.slice(1)}`)
            .setColor('#ffd700')
            .setDescription(leaderboard.length > 0 ? 
                leaderboard.map((user, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    const value = type === 'projects' ? `${user.value} projects` : `$${user.value.toLocaleString()}`;
                    return `${medal} **${user.displayName}** - ${value}`;
                }).join('\n') : 
                'No data available yet. Be the first to share your achievements!'
            )
            .setFooter({ text: 'Rankings update in real-time • Use /money privacy to control visibility' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // Profile Enhancement Handlers
    async handleProfileCommand(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'view':
                await this.showProfile(interaction);
                break;
            case 'edit':
                await this.editProfile(interaction);
                break;
            case 'showcase':
                await this.addProjectShowcase(interaction);
                break;
        }
    }

    async showProfile(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        
        const profileData = await this.getUserProfileData(userId);
        const financialData = await this.getUserFinancialData(userId);

        const embed = new EmbedBuilder()
            .setTitle(`👤 ${targetUser.displayName}'s Profile`)
            .setColor('#7289da')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields([
                {
                    name: '🎯 Professional Info',
                    value: `**Role:** ${profileData.role || 'Not specified'}\n**Experience:** ${profileData.experience || 'Not specified'}\n**Specialties:** ${profileData.specialties?.join(', ') || 'None listed'}`,
                    inline: true
                },
                {
                    name: '📊 Community Stats',
                    value: `**Projects Shared:** ${profileData.projectsShared || 0}\n**Solutions Provided:** ${profileData.solutionsProvided || 0}\n**Community Score:** ${profileData.communityScore || 0}`,
                    inline: true
                },
                {
                    name: '💼 Portfolio Highlights',
                    value: profileData.showcases?.slice(0, 3).map(showcase => `• ${showcase.title}`).join('\n') || 'No showcases yet',
                    inline: false
                }
            ])
            .setFooter({ text: `Member since ${profileData.joinedDate || 'Unknown'}` })
            .setTimestamp();

        if (targetUser.id === interaction.user.id) {
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('profile_edit')
                        .setLabel('Edit Profile')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('✏️'),
                    new ButtonBuilder()
                        .setCustomId('profile_add_showcase')
                        .setLabel('Add Showcase')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🌟')
                );

            await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    }

    // Community Leaderboard Handlers
    async handleLeaderboardCommand(interaction) {
        const type = interaction.options.getString('type');
        
        // This would connect to actual Discord analytics in a real implementation
        const mockData = this.generateMockLeaderboardData(type);

        const embed = new EmbedBuilder()
            .setTitle(`🏆 Community Leaderboard - ${this.getLeaderboardTitle(type)}`)
            .setColor('#ffd700')
            .setDescription(mockData.map((user, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                return `${medal} **${user.name}** - ${user.score}`;
            }).join('\n'))
            .setFooter({ text: 'Keep contributing to climb the ranks!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // Interactive Helpers and Button Handlers
    async handleMoneyButtonInteraction(interaction) {
        const customId = interaction.customId;

        switch (customId) {
            case 'money_quick_update':
                await this.showQuickUpdateModal(interaction);
                break;
            case 'money_add_project':
                await this.showAddProjectModal(interaction);
                break;
            case 'money_set_goals':
                await this.showSetGoalsModal(interaction);
                break;
        }
    }

    async showQuickUpdateModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('money_quick_update_modal')
            .setTitle('💰 Quick Financial Update');

        const revenueInput = new TextInputBuilder()
            .setCustomId('revenue_input')
            .setLabel('Monthly Revenue ($)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., 5000')
            .setRequired(false);

        const projectsInput = new TextInputBuilder()
            .setCustomId('projects_input')
            .setLabel('Projects Completed This Month')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., 3')
            .setRequired(false);

        const rateInput = new TextInputBuilder()
            .setCustomId('rate_input')
            .setLabel('Hourly Rate ($)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., 75')
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(revenueInput),
            new ActionRowBuilder().addComponents(projectsInput),
            new ActionRowBuilder().addComponents(rateInput)
        );

        await interaction.showModal(modal);
    }

    // Data Management
    async getUserFinancialData(userId) {
        try {
            const filePath = path.join(this.dataPath, 'financial.json');
            const data = await fs.readFile(filePath, 'utf8');
            const allData = JSON.parse(data);
            return allData[userId] || {};
        } catch (error) {
            return {};
        }
    }

    async saveUserFinancialData(userId, userData) {
        try {
            const filePath = path.join(this.dataPath, 'financial.json');
            let allData = {};
            
            try {
                const data = await fs.readFile(filePath, 'utf8');
                allData = JSON.parse(data);
            } catch (error) {
                // File doesn't exist yet
            }

            allData[userId] = userData;
            await fs.writeFile(filePath, JSON.stringify(allData, null, 2));
        } catch (error) {
            console.error('Error saving financial data:', error);
        }
    }

    async getAllFinancialData() {
        try {
            const filePath = path.join(this.dataPath, 'financial.json');
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    async getUserProfileData(userId) {
        try {
            const filePath = path.join(this.dataPath, 'profiles.json');
            const data = await fs.readFile(filePath, 'utf8');
            const allData = JSON.parse(data);
            return allData[userId] || {};
        } catch (error) {
            return {};
        }
    }

    generateMockLeaderboardData(type) {
        const mockUsers = [
            'Alex Chen', 'Sarah Johnson', 'Mike Rodriguez', 'Emma Davis', 'James Wilson',
            'Lisa Brown', 'David Kim', 'Rachel Green', 'Tom Anderson', 'Maya Patel'
        ];

        return mockUsers.slice(0, 5).map((name, index) => ({
            name,
            score: this.getMockScore(type, index)
        }));
    }

    getMockScore(type, index) {
        const baseScores = {
            messages: [247, 198, 165, 142, 128],
            helpful: [34, 28, 22, 18, 15],
            templates: [12, 9, 7, 5, 4],
            solutions: [89, 76, 64, 51, 43]
        };

        return baseScores[type]?.[index] || Math.floor(Math.random() * 100);
    }

    getLeaderboardTitle(type) {
        const titles = {
            messages: 'Most Active Contributors',
            helpful: 'Most Helpful (Solved Tags)',
            templates: 'Most Shared Templates',
            solutions: 'Best Solutions',
            rising: 'Rising Stars',
            weekly: 'Weekly Champions'
        };

        return titles[type] || 'Community Leaders';
    }
}

module.exports = InteractiveHandler;
