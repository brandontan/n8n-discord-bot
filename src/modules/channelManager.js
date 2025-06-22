const fs = require('fs').promises;
const path = require('path');
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const GuildStateManager = require('./guildStateManager');

class ChannelManager {
    constructor() {
        this.dataFile = path.join(__dirname, '../data/channelData.json');
        this.blueprintFile = path.join(__dirname, '../config/blueprint.json');
        this.stateManager = new GuildStateManager();
    }

    /**
     * Initialize channel data storage
     */
    async initializeDataStorage() {
        try {
            const dataDir = path.dirname(this.dataFile);
            await fs.mkdir(dataDir, { recursive: true });
            
            // Check if channel data file exists, create if not
            try {
                await fs.access(this.dataFile);
            } catch {
                await fs.writeFile(this.dataFile, JSON.stringify({ guilds: {} }, null, 2));
            }
        } catch (error) {
            console.error('Error initializing channel data storage:', error);
            throw error;
        }
    }

    /**
     * Load blueprint configuration
     */
    async loadBlueprint() {
        try {
            const blueprintData = await fs.readFile(this.blueprintFile, 'utf8');
            return JSON.parse(blueprintData);
        } catch (error) {
            console.error('Error loading blueprint:', error);
            throw error;
        }
    }

    /**
     * Load stored channel data
     */
    async loadChannelData() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading channel data:', error);
            return { guilds: {} };
        }
    }

    /**
     * Save channel data to storage
     */
    async saveChannelData(data) {
        try {
            await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving channel data:', error);
            throw error;
        }
    }

    /**
     * Get role ID by name from stored role data
     */
    async getRoleId(guild, roleName) {
        try {
            const roleDataFile = path.join(__dirname, '../data/roleData.json');
            const roleData = await fs.readFile(roleDataFile, 'utf8');
            const parsed = JSON.parse(roleData);
            return parsed.guilds[guild.id]?.roles[roleName]?.id || null;
        } catch (error) {
            console.error('Error getting role ID:', error);
            return null;
        }
    }

    /**
     * Create permission overwrites for channels
     */
    async createPermissionOverwrites(guild, channelConfig, roleIds) {
        const overwrites = [];

        // Default: deny @everyone for private channels, allow for public
        if (channelConfig.private) {
            overwrites.push({
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            });
        } else {
            overwrites.push({
                id: guild.roles.everyone.id,
                allow: [PermissionFlagsBits.ViewChannel]
            });
        }

        // Add specific role permissions
        if (channelConfig.allowedRoles) {
            for (const roleName of channelConfig.allowedRoles) {
                const roleId = roleIds[roleName];
                if (roleId) {
                    overwrites.push({
                        id: roleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    });
                }
            }
        }

        // Special permissions for Hiring/Client roles (future expansion)
        const hiringRoleId = roleIds['Hiring Manager'];
        const clientRoleId = roleIds['Client'];
        
        if (channelConfig.private && (hiringRoleId || clientRoleId)) {
            if (hiringRoleId) {
                overwrites.push({
                    id: hiringRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages
                    ]
                });
            }
            if (clientRoleId) {
                overwrites.push({
                    id: clientRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                });
            }
        }

        return overwrites;
    }

    /**
     * Create forum channel with available tags
     */
    async createForumChannel(guild, channelConfig, category, roleIds) {
        const permissionOverwrites = await this.createPermissionOverwrites(guild, channelConfig, roleIds);
        
        const forumChannel = await guild.channels.create({
            name: channelConfig.name,
            type: ChannelType.GuildForum,
            parent: category,
            topic: channelConfig.description || channelConfig.topic,
            permissionOverwrites,
            reason: 'n8n Discord Bot - Blueprint Channel Setup'
        });

        // Set available tags for forum
        if (channelConfig.availableTags && channelConfig.availableTags.length > 0) {
            try {
                await forumChannel.edit({
                    availableTags: channelConfig.availableTags.map(tag => ({
                        name: tag,
                        moderated: false
                    }))
                });
            } catch (error) {
                console.error(`Error setting forum tags for ${channelConfig.name}:`, error);
            }
        }

        return forumChannel;
    }

    /**
     * Create regular text/voice channel
     */
    async createRegularChannel(guild, channelConfig, category, roleIds) {
        const permissionOverwrites = await this.createPermissionOverwrites(guild, channelConfig, roleIds);
        
        let channelType = ChannelType.GuildText;
        if (channelConfig.type === 'voice') {
            channelType = ChannelType.GuildVoice;
        } else if (channelConfig.type === 'forum') {
            return await this.createForumChannel(guild, channelConfig, category, roleIds);
        }

        return await guild.channels.create({
            name: channelConfig.name,
            type: channelType,
            parent: category,
            topic: channelConfig.description || channelConfig.topic,
            permissionOverwrites,
            reason: 'n8n Discord Bot - Blueprint Channel Setup'
        });
    }

    /**
     * Setup channels and categories for a guild based on blueprint with error handling and state tracking
     */
    async setupGuildChannels(guild) {
        const isDryRun = this.stateManager.isDryRun();
        const results = {
            success: true,
            createdCategories: [],
            createdChannels: [],
            skippedCategories: [],
            skippedChannels: [],
            failedCategories: [],
            failedChannels: [],
            errors: [],
            totalCategories: 0,
            totalChannels: 0
        };

        try {
            console.log(`${isDryRun ? '[DRY RUN] ' : ''}Setting up channels for guild: ${guild.name}`);
            
            await this.initializeDataStorage();
            const blueprint = await this.loadBlueprint();
            const channelData = await this.loadChannelData();
            
            // Initialize guild data if not exists
            if (!channelData.guilds[guild.id]) {
                channelData.guilds[guild.id] = {
                    name: guild.name,
                    categories: {},
                    channels: {},
                    setupDate: new Date().toISOString()
                };
            }

            const guildData = channelData.guilds[guild.id];
            
            // Calculate totals
            if (blueprint.channels?.categories) {
                results.totalCategories = blueprint.channels.categories.length;
                results.totalChannels = blueprint.channels.categories.reduce((sum, cat) => sum + (cat.channels?.length || 0), 0);
            }

            // Get missing categories and channels that need to be created/fixed
            const missingCategories = await this.stateManager.getMissingCategories(guild.id, blueprint.channels?.categories || []);
            const missingChannels = await this.stateManager.getMissingChannels(guild.id, blueprint.channels?.categories || []);
            
            if (missingCategories.length === 0 && missingChannels.length === 0) {
                console.log('All categories and channels already exist and are properly configured.');
                // Still update skipped counts
                if (blueprint.channels?.categories) {
                    for (const categoryConfig of blueprint.channels.categories) {
                        results.skippedCategories.push(categoryConfig.name);
                        if (categoryConfig.channels) {
                            for (const channelConfig of categoryConfig.channels) {
                                results.skippedChannels.push(channelConfig.name);
                            }
                        }
                    }
                }
                return results;
            }

            if (isDryRun) {
                console.log(`[DRY RUN] Would create ${missingCategories.length} categories and ${missingChannels.length} channels:`);
                missingCategories.forEach(cat => {
                    console.log(`[DRY RUN] - Category: ${cat.name} (private: ${cat.private})`);
                });
                missingChannels.forEach(ch => {
                    console.log(`[DRY RUN] - Channel: ${ch.name} (type: ${ch.type}, category: ${ch.categoryName})`);
                });
                results.createdCategories = missingCategories.map(cat => cat.name);
                results.createdChannels = missingChannels.map(ch => ch.name);
                return results;
            }

            // Get role IDs for permission setup
            const roleIds = {};
            try {
                const roleDataFile = path.join(__dirname, '../data/roleData.json');
                const roleData = await fs.readFile(roleDataFile, 'utf8');
                const parsed = JSON.parse(roleData);
                const guildRoles = parsed.guilds[guild.id]?.roles || {};
                
                for (const [roleName, roleInfo] of Object.entries(guildRoles)) {
                    roleIds[roleName] = roleInfo.id;
                }
            } catch (error) {
                console.warn('Could not load role data for permissions:', error.message);
            }

            // Process categories and channels from blueprint
            if (blueprint.channels && blueprint.channels.categories) {
                for (const categoryConfig of blueprint.channels.categories) {
                    try {
                        // Check if category already exists
                        let existingCategory = guild.channels.cache.find(
                            channel => channel.type === ChannelType.GuildCategory && 
                                      channel.name === categoryConfig.name
                        );
                        
                        let category;
                        if (existingCategory) {
                            console.log(`Category '${categoryConfig.name}' already exists, skipping creation`);
                            results.skippedCategories.push(categoryConfig.name);
                            category = existingCategory;
                            
                            // Mark in state as existing
                            await this.stateManager.markCategoryState(guild.id, guild.name, categoryConfig.name, existingCategory.id, 'existing');
                        } else {
                            // Create category with error handling
                            console.log(`Creating category: ${categoryConfig.name}`);
                            
                            const categoryOverwrites = [];
                            if (categoryConfig.private) {
                                categoryOverwrites.push({
                                    id: guild.roles.everyone.id,
                                    deny: [PermissionFlagsBits.ViewChannel]
                                });
                            } else {
                                categoryOverwrites.push({
                                    id: guild.roles.everyone.id,
                                    allow: [PermissionFlagsBits.ViewChannel]
                                });
                            }

                            category = await guild.channels.create({
                                name: categoryConfig.name,
                                type: ChannelType.GuildCategory,
                                permissionOverwrites: categoryOverwrites,
                                reason: 'n8n Discord Bot - Blueprint Category Setup'
                            });
                            
                            results.createdCategories.push(categoryConfig.name);
                            
                            // Mark in state as created
                            await this.stateManager.markCategoryState(guild.id, guild.name, categoryConfig.name, category.id, 'created');
                        }

                        // Store category data
                        guildData.categories[categoryConfig.name] = {
                            id: category.id,
                            private: categoryConfig.private || false,
                            createdAt: guildData.categories[categoryConfig.name]?.createdAt || new Date().toISOString()
                        };

                        // Create child channels
                        if (categoryConfig.channels && categoryConfig.channels.length > 0) {
                            for (const channelConfig of categoryConfig.channels) {
                                try {
                                    // Check if channel already exists
                                    let existingChannel = guild.channels.cache.find(
                                        channel => channel.name === channelConfig.name && 
                                                  channel.parentId === category.id
                                    );
                                    
                                    if (existingChannel) {
                                        console.log(`Channel '${channelConfig.name}' already exists, skipping creation`);
                                        results.skippedChannels.push(channelConfig.name);
                                        
                                        // Store existing channel data
                                        guildData.channels[channelConfig.name] = {
                                            id: existingChannel.id,
                                            categoryId: category.id,
                                            type: existingChannel.type,
                                            createdAt: guildData.channels[channelConfig.name]?.createdAt || new Date().toISOString()
                                        };
                                        
                                        // Mark in state as existing
                                        await this.stateManager.markChannelState(guild.id, guild.name, channelConfig.name, existingChannel.id, category.id, 'existing');
                                        continue;
                                    }

                                    // Create new channel with error handling
                                    console.log(`Creating channel: ${channelConfig.name} in category: ${categoryConfig.name}`);
                                    
                                    let newChannel;
                                    if (channelConfig.type === 'forum') {
                                        newChannel = await this.createForumChannel(guild, channelConfig, category, roleIds);
                                    } else {
                                        newChannel = await this.createRegularChannel(guild, channelConfig, category, roleIds);
                                    }

                                    // Store channel data
                                    guildData.channels[channelConfig.name] = {
                                        id: newChannel.id,
                                        categoryId: category.id,
                                        type: newChannel.type,
                                        createdAt: new Date().toISOString()
                                    };

                                    // Mark in state as created
                                    await this.stateManager.markChannelState(guild.id, guild.name, channelConfig.name, newChannel.id, category.id, 'created');
                                    
                                    results.createdChannels.push(channelConfig.name);
                                    
                                    // Small delay to avoid rate limits
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                    
                                } catch (channelError) {
                                    console.error(`Error creating channel '${channelConfig.name}':`, channelError);
                                    
                                    // Record error in state
                                    await this.stateManager.recordError(guild.id, guild.name, channelError, `Creating channel: ${channelConfig.name}`);
                                    
                                    // Add to failed results
                                    results.failedChannels.push(channelConfig.name);
                                    
                                    // Get actionable error hint
                                    const errorHint = this.stateManager.getErrorHint(channelError);
                                    results.errors.push({
                                        channel: channelConfig.name,
                                        error: channelError.message,
                                        code: channelError.code,
                                        hint: errorHint
                                    });
                                    
                                    // Mark as failed in state
                                    await this.stateManager.markChannelState(guild.id, guild.name, channelConfig.name, null, category.id, 'failed');
                                }
                            }
                        }
                        
                        // Small delay between categories
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                    } catch (categoryError) {
                        console.error(`Error creating category '${categoryConfig.name}':`, categoryError);
                        
                        // Record error in state
                        await this.stateManager.recordError(guild.id, guild.name, categoryError, `Creating category: ${categoryConfig.name}`);
                        
                        // Add to failed results
                        results.failedCategories.push(categoryConfig.name);
                        
                        // Get actionable error hint
                        const errorHint = this.stateManager.getErrorHint(categoryError);
                        results.errors.push({
                            category: categoryConfig.name,
                            error: categoryError.message,
                            code: categoryError.code,
                            hint: errorHint
                        });
                        
                        // Mark as failed in state
                        await this.stateManager.markCategoryState(guild.id, guild.name, categoryConfig.name, null, 'failed');
                    }
                }
            }

            // Save updated channel data
            await this.saveChannelData(channelData);

            console.log(`Channel setup complete for ${guild.name}:`);
            console.log(`- Created categories: ${results.createdCategories.length}`);
            console.log(`- Created channels: ${results.createdChannels.length}`);
            console.log(`- Skipped categories: ${results.skippedCategories.length}`);
            console.log(`- Skipped channels: ${results.skippedChannels.length}`);
            console.log(`- Failed categories: ${results.failedCategories.length}`);
            console.log(`- Failed channels: ${results.failedChannels.length}`);

            if (results.failedCategories.length === 0 && results.failedChannels.length === 0) {
                await this.stateManager.markSetupComplete(guild.id, guild.name);
            }

            return results;

        } catch (error) {
            console.error('Error setting up guild channels:', error);
            
            // Record error in state
            await this.stateManager.recordError(guild.id, guild.name, error, 'Channel setup - general error');
            
            results.success = false;
            results.errors.push({
                channel: 'GENERAL',
                error: error.message,
                code: error.code,
                hint: this.stateManager.getErrorHint(error)
            });
            
            return results;
        }
    }

    /**
     * Get channel ID by name from stored data
     */
    async getChannelId(guildId, channelName) {
        try {
            const channelData = await this.loadChannelData();
            return channelData.guilds[guildId]?.channels[channelName]?.id || null;
        } catch (error) {
            console.error('Error getting channel ID:', error);
            return null;
        }
    }

    /**
     * Get category ID by name from stored data
     */
    async getCategoryId(guildId, categoryName) {
        try {
            const channelData = await this.loadChannelData();
            return channelData.guilds[guildId]?.categories[categoryName]?.id || null;
        } catch (error) {
            console.error('Error getting category ID:', error);
            return null;
        }
    }

    /**
     * Get all stored guild channel data
     */
    async getGuildChannelData(guildId) {
        try {
            const channelData = await this.loadChannelData();
            return channelData.guilds[guildId] || null;
        } catch (error) {
            console.error('Error getting guild channel data:', error);
            return null;
        }
    }

    /**
     * Remove channel data for a guild (cleanup)
     */
    async removeGuildData(guildId) {
        try {
            const channelData = await this.loadChannelData();
            if (channelData.guilds[guildId]) {
                delete channelData.guilds[guildId];
                await this.saveChannelData(channelData);
                console.log(`Removed channel data for guild: ${guildId}`);
            }
        } catch (error) {
            console.error('Error removing guild channel data:', error);
        }
    }
}

module.exports = ChannelManager;
