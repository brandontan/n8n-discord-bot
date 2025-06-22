const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');

class SpotlightManager {
    constructor() {
        this.dataFile = path.join(__dirname, '../data/spotlight.json');
        this.cronJob = null;
        this.client = null;
        this.usedSpotlights = new Set(); // Track used spotlights to avoid repeats
        this.lastResetWeek = null; // Track when we last reset the used set
    }

    setClient(client) {
        this.client = client;
    }

    // Start the weekly spotlight cron job
    start() {
        if (this.cronJob) {
            console.log('Weekly Spotlight: Cron job already running');
            return;
        }

        // Schedule for every Monday at 00:00 UTC
        this.cronJob = cron.schedule('0 0 * * 1', async () => {
            console.log('Weekly Spotlight: Executing scheduled spotlight post...');
            try {
                await this.postWeeklySpotlight();
            } catch (error) {
                console.error('Weekly Spotlight: Error during scheduled execution:', error);
            }
        }, {
            timezone: 'UTC',
            scheduled: true
        });

        console.log('Weekly Spotlight: Cron job started - running every Monday at 00:00 UTC');
    }

    // Stop the cron job
    stop() {
        if (this.cronJob) {
            this.cronJob.destroy();
            this.cronJob = null;
            console.log('Weekly Spotlight: Cron job stopped');
        }
    }

    // Load spotlight data from file
    loadSpotlightData() {
        try {
            const data = fs.readFileSync(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Weekly Spotlight: Error loading spotlight data:', error);
            return null;
        }
    }

    // Get random spotlight from local data or external sources
    async getRandomSpotlight() {
        const data = this.loadSpotlightData();
        if (!data) {
            console.error('Weekly Spotlight: Could not load spotlight data');
            return null;
        }

        // Check if we need to reset the used spotlights (new week cycle)
        const currentWeek = this.getCurrentWeekNumber();
        if (this.lastResetWeek !== currentWeek) {
            this.usedSpotlights.clear();
            this.lastResetWeek = currentWeek;
            console.log('Weekly Spotlight: Reset used spotlights for new week cycle');
        }

        // Try to get content from external sources first
        let spotlight = null;
        
        if (data.settings.enable_n8n_integration && data.settings.n8n_webhook_url) {
            spotlight = await this.fetchFromN8N(data.settings.n8n_webhook_url);
        }

        if (!spotlight && data.settings.enable_gsheets_integration && data.settings.gsheets_url) {
            spotlight = await this.fetchFromGSheets(data.settings.gsheets_url);
        }

        // Fall back to local data if external sources fail
        if (!spotlight) {
            spotlight = this.selectRandomFromLocal(data.spotlights);
        }

        return spotlight || this.getFallbackSpotlight(data.settings);
    }

    // Fetch spotlight from n8n webhook
    async fetchFromN8N(webhookUrl) {
        try {
            console.log('Weekly Spotlight: Fetching from n8n webhook...');
            const response = await fetch(webhookUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Weekly Spotlight: Successfully fetched from n8n');
            return this.validateSpotlightData(data);
        } catch (error) {
            console.error('Weekly Spotlight: Error fetching from n8n:', error);
            return null;
        }
    }

    // Fetch spotlight from Google Sheets
    async fetchFromGSheets(sheetsUrl) {
        try {
            console.log('Weekly Spotlight: Fetching from Google Sheets...');
            // Convert Google Sheets URL to CSV export URL
            const csvUrl = sheetsUrl.replace('/edit#gid=', '/export?format=csv&gid=');
            
            const response = await fetch(csvUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const csvData = await response.text();
            const spotlight = this.parseCSVSpotlight(csvData);
            console.log('Weekly Spotlight: Successfully fetched from Google Sheets');
            return spotlight;
        } catch (error) {
            console.error('Weekly Spotlight: Error fetching from Google Sheets:', error);
            return null;
        }
    }

    // Parse CSV data from Google Sheets
    parseCSVSpotlight(csvData) {
        try {
            const lines = csvData.split('\n').filter(line => line.trim());
            if (lines.length < 2) return null;

            // Assume first row is headers, get random row from data
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const dataRows = lines.slice(1);
            const randomRow = dataRows[Math.floor(Math.random() * dataRows.length)];
            const values = randomRow.split(',').map(v => v.trim().replace(/"/g, ''));

            const spotlight = {};
            headers.forEach((header, index) => {
                spotlight[header.toLowerCase()] = values[index] || '';
            });

            return this.validateSpotlightData(spotlight);
        } catch (error) {
            console.error('Weekly Spotlight: Error parsing CSV data:', error);
            return null;
        }
    }

    // Select random spotlight from local data
    selectRandomFromLocal(spotlights) {
        if (!spotlights || spotlights.length === 0) return null;

        // Filter out already used spotlights
        const availableSpotlights = spotlights.filter(s => !this.usedSpotlights.has(s.id));
        
        // If all spotlights have been used, reset and use all
        const spotlightPool = availableSpotlights.length > 0 ? availableSpotlights : spotlights;
        
        const randomIndex = Math.floor(Math.random() * spotlightPool.length);
        const selectedSpotlight = spotlightPool[randomIndex];
        
        // Mark as used
        this.usedSpotlights.add(selectedSpotlight.id);
        
        console.log(`Weekly Spotlight: Selected local spotlight: ${selectedSpotlight.title}`);
        return selectedSpotlight;
    }

    // Validate and normalize spotlight data
    validateSpotlightData(data) {
        if (!data || typeof data !== 'object') return null;

        return {
            id: data.id || `spotlight-${Date.now()}`,
            title: data.title || 'Weekly Spotlight',
            description: data.description || 'Check out this amazing content!',
            link: data.link || 'https://n8n.io',
            thumbnail: data.thumbnail || '',
            tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()) : []),
            type: data.type || 'content'
        };
    }

    // Get fallback spotlight when all else fails
    getFallbackSpotlight(settings) {
        return {
            id: 'fallback',
            title: '🌟 Weekly Spotlight',
            description: settings.fallback_message || 'Explore the amazing world of automation with n8n!',
            link: 'https://n8n.io',
            thumbnail: settings.fallback_thumbnail || '',
            tags: ['n8n', 'Automation', 'Workflows'],
            type: 'fallback'
        };
    }

    // Create Discord embed for spotlight
    createSpotlightEmbed(spotlight) {
        const embed = new EmbedBuilder()
            .setTitle(spotlight.title)
            .setDescription(spotlight.description)
            .setURL(spotlight.link)
            .setColor(0x7289DA) // Discord blurple
            .setTimestamp()
            .setFooter({ 
                text: 'Weekly Spotlight • Discuss in thread 💬',
                iconURL: 'https://n8n.io/favicon.ico'
            });

        if (spotlight.thumbnail && spotlight.thumbnail.trim() !== '') {
            embed.setThumbnail(spotlight.thumbnail);
        }

        if (spotlight.tags && spotlight.tags.length > 0) {
            embed.addFields({
                name: '🏷️ Tags',
                value: spotlight.tags.map(tag => `\`${tag}\``).join(' '),
                inline: true
            });
        }

        if (spotlight.type) {
            embed.addFields({
                name: '📂 Type',
                value: spotlight.type.charAt(0).toUpperCase() + spotlight.type.slice(1),
                inline: true
            });
        }

        return embed;
    }

    // Post the weekly spotlight to all configured guilds
    async postWeeklySpotlight() {
        if (!this.client) {
            console.error('Weekly Spotlight: Discord client not set');
            return;
        }

        const spotlight = await this.getRandomSpotlight();
        if (!spotlight) {
            console.error('Weekly Spotlight: Could not get spotlight content');
            return;
        }

        console.log(`Weekly Spotlight: Posting spotlight: ${spotlight.title}`);

        // Post to all guilds that have a weekly-spotlight channel
        for (const guild of this.client.guilds.cache.values()) {
            try {
                await this.postToGuild(guild, spotlight);
            } catch (error) {
                console.error(`Weekly Spotlight: Error posting to guild ${guild.name}:`, error);
            }
        }
    }

    // Post spotlight to a specific guild
    async postToGuild(guild, spotlight) {
        // Find the weekly-spotlight channel
        const spotlightChannel = guild.channels.cache.find(
            channel => channel.name === 'weekly-spotlight' && channel.type === 0 // Text channel
        );

        if (!spotlightChannel) {
            console.log(`Weekly Spotlight: No #weekly-spotlight channel found in guild: ${guild.name}`);
            return;
        }

        // Create and send the embed
        const embed = this.createSpotlightEmbed(spotlight);
        const message = await spotlightChannel.send({
            content: '🌟 **Weekly Spotlight** 🌟\n\nDiscover something amazing this week!',
            embeds: [embed]
        });

        console.log(`Weekly Spotlight: Posted to ${guild.name} in #${spotlightChannel.name}`);

        // Create a thread for discussion
        try {
            const thread = await message.startThread({
                name: `💬 Discuss: ${spotlight.title.slice(0, 50)}${spotlight.title.length > 50 ? '...' : ''}`,
                autoArchiveDuration: 10080, // 7 days
                reason: 'Weekly Spotlight discussion thread'
            });

            await thread.send('Welcome to the discussion! Share your thoughts, questions, and related experiences here. 💭');
            console.log(`Weekly Spotlight: Created discussion thread in ${guild.name}`);
        } catch (error) {
            console.error(`Weekly Spotlight: Error creating thread in ${guild.name}:`, error);
        }

        // Manage pinned messages
        await this.managePinnedMessages(spotlightChannel, message);
    }

    // Manage pinned messages (pin new, unpin old)
    async managePinnedMessages(channel, newMessage) {
        try {
            const data = this.loadSpotlightData();
            const maxPinned = data?.settings?.max_pinned_messages || 4;

            // Get current pinned messages
            const pinnedMessages = await channel.messages.fetchPinned();
            const spotlightPins = pinnedMessages.filter(msg => 
                msg.embeds.length > 0 && 
                msg.embeds[0].footer?.text?.includes('Weekly Spotlight')
            );

            // Pin the new message
            await newMessage.pin();
            console.log(`Weekly Spotlight: Pinned new spotlight message in #${channel.name}`);

            // If we have more than the max, unpin the oldest
            if (spotlightPins.size >= maxPinned) {
                const sortedPins = Array.from(spotlightPins.values())
                    .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                
                const toUnpin = sortedPins.slice(0, sortedPins.length - maxPinned + 1);
                
                for (const oldMessage of toUnpin) {
                    try {
                        await oldMessage.unpin();
                        console.log(`Weekly Spotlight: Unpinned old spotlight message in #${channel.name}`);
                    } catch (error) {
                        console.error(`Weekly Spotlight: Error unpinning message:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Weekly Spotlight: Error managing pinned messages:', error);
        }
    }

    // Utility function to get current week number
    getCurrentWeekNumber() {
        const date = new Date();
        const yearStart = new Date(date.getFullYear(), 0, 1);
        const weekNumber = Math.ceil((((date - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
        return weekNumber;
    }

    // Manual trigger for testing
    async triggerManualSpotlight(guild) {
        if (!guild) {
            console.error('Weekly Spotlight: No guild provided for manual trigger');
            return false;
        }

        try {
            const spotlight = await this.getRandomSpotlight();
            if (!spotlight) {
                console.error('Weekly Spotlight: Could not get spotlight content for manual trigger');
                return false;
            }

            await this.postToGuild(guild, spotlight);
            console.log(`Weekly Spotlight: Manual spotlight posted to ${guild.name}`);
            return true;
        } catch (error) {
            console.error('Weekly Spotlight: Error during manual trigger:', error);
            return false;
        }
    }

    // Get status information
    getStatus() {
        return {
            isRunning: this.cronJob !== null,
            nextRun: this.cronJob ? this.cronJob.getStatus() : null,
            usedSpotlightsCount: this.usedSpotlights.size,
            lastResetWeek: this.lastResetWeek,
            currentWeek: this.getCurrentWeekNumber()
        };
    }
}

module.exports = SpotlightManager;
