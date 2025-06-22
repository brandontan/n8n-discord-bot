const fs = require('fs').promises;
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class GamificationManager {
    constructor() {
        this.config = null;
        this.userDataPath = path.join(__dirname, '..', 'data', 'userProgress.json');
        this.userProgress = new Map();
        this.loadConfig();
        this.loadUserProgress();
    }

    async loadConfig() {
        try {
            const configPath = path.join(__dirname, '..', 'config', 'gamification.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);
        } catch (error) {
            console.error('Failed to load gamification config:', error);
        }
    }

    async loadUserProgress() {
        try {
            const data = await fs.readFile(this.userDataPath, 'utf8');
            const progressData = JSON.parse(data);
            this.userProgress = new Map(Object.entries(progressData));
        } catch (error) {
            // File doesn't exist yet, start with empty progress
            this.userProgress = new Map();
        }
    }

    async saveUserProgress() {
        try {
            const progressObj = Object.fromEntries(this.userProgress);
            await fs.writeFile(this.userDataPath, JSON.stringify(progressObj, null, 2));
        } catch (error) {
            console.error('Failed to save user progress:', error);
        }
    }

    getUserProgress(userId) {
        if (!this.userProgress.has(userId)) {
            this.userProgress.set(userId, {
                helpfulness: { points: 0, level: 1 },
                earnings: { amount: 0, level: 1 },
                badges: [],
                unlockedFeatures: ['basic'],
                joinDate: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            });
            this.saveUserProgress();
        }
        return this.userProgress.get(userId);
    }

    async addHelpfulnessPoints(userId, points, reason = 'general_help') {
        const progress = this.getUserProgress(userId);
        const oldLevel = progress.helpfulness.level;
        
        // Apply bonus multipliers
        const multiplier = this.getBonusMultiplier();
        const finalPoints = Math.floor(points * multiplier);
        
        progress.helpfulness.points += finalPoints;
        progress.lastActivity = new Date().toISOString();

        // Check for level up
        const newLevel = this.calculateLevel('helpfulness', progress.helpfulness.points);
        const leveledUp = newLevel > oldLevel;
        
        if (leveledUp) {
            progress.helpfulness.level = newLevel;
            await this.handleLevelUp(userId, 'helpfulness', newLevel);
        }

        // Check for badge achievements
        await this.checkBadgeEligibility(userId, 'helpfulness', progress);

        this.saveUserProgress();
        
        return {
            leveledUp,
            oldLevel,
            newLevel,
            pointsAdded: finalPoints,
            totalPoints: progress.helpfulness.points
        };
    }

    async addEarnings(userId, amount, description = '') {
        const progress = this.getUserProgress(userId);
        const oldLevel = progress.earnings.level;
        
        progress.earnings.amount += amount;
        progress.lastActivity = new Date().toISOString();

        // Check for level up
        const newLevel = this.calculateLevel('earnings', progress.earnings.amount);
        const leveledUp = newLevel > oldLevel;
        
        if (leveledUp) {
            progress.earnings.level = newLevel;
            await this.handleLevelUp(userId, 'earnings', newLevel);
        }

        // Check for badge achievements
        await this.checkBadgeEligibility(userId, 'earnings', progress);

        this.saveUserProgress();
        
        return {
            leveledUp,
            oldLevel,
            newLevel,
            amountAdded: amount,
            totalAmount: progress.earnings.amount
        };
    }

    calculateLevel(type, value) {
        const tiers = this.config.levels[type].tiers;
        let level = 1;
        
        for (const tier of tiers) {
            const requirement = type === 'helpfulness' ? tier.pointsRequired : tier.amountRequired;
            if (value >= requirement) {
                level = tier.level;
            } else {
                break;
            }
        }
        
        return level;
    }

    getBonusMultiplier() {
        const now = new Date();
        const day = now.getDay();
        
        // Weekend bonus (Saturday = 6, Sunday = 0)
        if (day === 0 || day === 6) {
            return this.config.pointSources.bonus_multipliers.weekend;
        }
        
        return 1.0;
    }

    async handleLevelUp(userId, type, newLevel) {
        try {
            // Get the level tier information
            const tier = this.config.levels[type].tiers.find(t => t.level === newLevel);
            if (!tier) return;

            // Unlock new features
            await this.unlockFeatures(userId, newLevel);

            // Create celebration embed
            const embed = this.createLevelUpEmbed(userId, type, tier);
            
            // Send level up notification (this would be called from the main bot)
            this.pendingLevelUpNotifications = this.pendingLevelUpNotifications || [];
            this.pendingLevelUpNotifications.push({
                userId,
                type,
                tier,
                embed
            });

        } catch (error) {
            console.error('Error handling level up:', error);
        }
    }

    createLevelUpEmbed(userId, type, tier) {
        const embed = new EmbedBuilder()
            .setTitle(`🎉 Level Up! ${tier.icon} ${tier.name}`)
            .setDescription(`Congratulations! You've reached **${tier.name}** level in ${this.config.levels[type].name}!`)
            .setColor(tier.color)
            .addFields([
                {
                    name: '✨ New Features Unlocked',
                    value: tier.rewards ? tier.rewards.join('\n• ') : 'Special recognition',
                    inline: false
                },
                {
                    name: '🎯 Description',
                    value: tier.description,
                    inline: true
                }
            ])
            .setFooter({ text: 'Keep up the amazing work! The community appreciates you!' })
            .setTimestamp();

        return embed;
    }

    async unlockFeatures(userId, level) {
        const progress = this.getUserProgress(userId);
        const levelKey = `level${level}`;
        
        if (this.config.rewards.features[levelKey]) {
            const newFeatures = this.config.rewards.features[levelKey];
            progress.unlockedFeatures = [...new Set([...progress.unlockedFeatures, ...newFeatures])];
        }
    }

    async checkBadgeEligibility(userId, category, progress) {
        const badges = this.config.badges[category === 'helpfulness' ? 'achievement' : 'earning'];
        
        for (const badge of badges) {
            if (progress.badges.includes(badge.id)) continue;
            
            const earned = await this.checkBadgeRequirement(badge.id, progress);
            if (earned) {
                progress.badges.push(badge.id);
                await this.awardBadge(userId, badge);
            }
        }
    }

    async checkBadgeRequirement(badgeId, progress) {
        switch (badgeId) {
            case 'first_help':
                return progress.helpfulness.points >= 5;
            case 'helpful_streak':
                // This would require more complex tracking
                return progress.helpfulness.points >= 70; // Approximation
            case 'problem_solver':
                return progress.helpfulness.points >= 200;
            case 'community_builder':
                return progress.helpfulness.points >= 750;
            case 'first_milestone':
                return progress.earnings.amount >= 100;
            case 'consistent_earner':
                // This would require more complex tracking
                return progress.earnings.amount >= 5000; // Approximation
            case 'big_win':
                return progress.earnings.amount >= 5000;
            case 'diversified':
                // This would require client tracking
                return progress.earnings.amount >= 15000; // Approximation
            default:
                return false;
        }
    }

    async awardBadge(userId, badge) {
        // Create badge notification
        this.pendingBadgeNotifications = this.pendingBadgeNotifications || [];
        this.pendingBadgeNotifications.push({
            userId,
            badge,
            embed: this.createBadgeEmbed(badge)
        });
    }

    createBadgeEmbed(badge) {
        return new EmbedBuilder()
            .setTitle(`🏆 Badge Earned! ${badge.icon} ${badge.name}`)
            .setDescription(badge.description)
            .setColor(badge.color)
            .addFields([
                {
                    name: '🔓 Features Unlocked',
                    value: badge.unlocks.join('\n• '),
                    inline: false
                }
            ])
            .setTimestamp();
    }

    createProgressEmbed(userId) {
        const progress = this.getUserProgress(userId);
        const helpTier = this.config.levels.helpfulness.tiers.find(t => t.level === progress.helpfulness.level);
        const earningsTier = this.config.levels.earnings.tiers.find(t => t.level === progress.earnings.level);
        
        // Calculate progress to next level
        const nextHelpLevel = this.config.levels.helpfulness.tiers.find(t => t.level === progress.helpfulness.level + 1);
        const nextEarningsLevel = this.config.levels.earnings.tiers.find(t => t.level === progress.earnings.level + 1);

        const embed = new EmbedBuilder()
            .setTitle(`🎯 Your Progress & Achievements`)
            .setColor('#3498db')
            .addFields([
                {
                    name: `🤝 Helpfulness Level: ${helpTier.icon} ${helpTier.name}`,
                    value: `**${progress.helpfulness.points}** points\n${nextHelpLevel ? `Next: ${nextHelpLevel.name} (${nextHelpLevel.pointsRequired - progress.helpfulness.points} points to go)` : 'Max level reached!'}`,
                    inline: true
                },
                {
                    name: `💰 Success Level: ${earningsTier.icon} ${earningsTier.name}`,
                    value: `**$${progress.earnings.amount.toLocaleString()}** tracked\n${nextEarningsLevel ? `Next: ${nextEarningsLevel.name} ($${(nextEarningsLevel.amountRequired - progress.earnings.amount).toLocaleString()} to go)` : 'Max level reached!'}`,
                    inline: true
                },
                {
                    name: '🏆 Badges Earned',
                    value: progress.badges.length > 0 ? 
                        this.getBadgeDisplay(progress.badges) : 
                        'No badges yet - start helping to earn your first!',
                    inline: false
                }
            ])
            .setFooter({ text: 'Keep engaging with the community to level up!' })
            .setTimestamp();

        return embed;
    }

    getBadgeDisplay(badgeIds) {
        const allBadges = [
            ...this.config.badges.achievement,
            ...this.config.badges.earning,
            ...this.config.badges.social,
            ...this.config.badges.special
        ];

        return badgeIds.map(id => {
            const badge = allBadges.find(b => b.id === id);
            return badge ? `${badge.icon} ${badge.name}` : id;
        }).join('\n');
    }

    createLeaderboardEmbed(type, guild) {
        const title = this.config.leaderboards[type].title;
        const description = this.config.leaderboards[type].description;
        
        // Sort users by their progress
        const sortedUsers = Array.from(this.userProgress.entries())
            .map(([userId, progress]) => ({
                userId,
                value: type === 'helpfulness' ? progress.helpfulness.points : progress.earnings.amount,
                level: type === 'helpfulness' ? progress.helpfulness.level : progress.earnings.level
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor('#f1c40f');

        if (sortedUsers.length > 0) {
            const leaderboardText = sortedUsers.map((user, index) => {
                const member = guild?.members.cache.get(user.userId);
                const displayName = member?.displayName || 'Unknown User';
                const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
                const tier = this.config.levels[type].tiers.find(t => t.level === user.level);
                
                return `${medal} ${displayName} - ${tier?.icon || '⭐'} **${type === 'helpfulness' ? user.value + ' points' : '$' + user.value.toLocaleString()}**`;
            }).join('\n');

            embed.addFields([{
                name: '🏆 Top Contributors',
                value: leaderboardText,
                inline: false
            }]);
        } else {
            embed.addFields([{
                name: '🏆 Leaderboard',
                value: 'No data yet - be the first to make the leaderboard!',
                inline: false
            }]);
        }

        return embed;
    }

    checkFeatureAccess(userId, feature) {
        const progress = this.getUserProgress(userId);
        return progress.unlockedFeatures.includes(feature);
    }

    // Get pending notifications to be sent by the main bot
    getAndClearPendingNotifications() {
        const levelUps = this.pendingLevelUpNotifications || [];
        const badges = this.pendingBadgeNotifications || [];
        
        this.pendingLevelUpNotifications = [];
        this.pendingBadgeNotifications = [];
        
        return { levelUps, badges };
    }
}

module.exports = GamificationManager;
