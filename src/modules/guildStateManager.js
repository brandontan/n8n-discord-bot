const fs = require('fs').promises;
const path = require('path');

class GuildStateManager {
    constructor() {
        this.stateFile = path.join(__dirname, '../data/guildState.json');
    }

    /**
     * Initialize guild state storage
     */
    async initializeStateStorage() {
        try {
            const dataDir = path.dirname(this.stateFile);
            await fs.mkdir(dataDir, { recursive: true });
            
            // Check if state file exists, create if not
            try {
                await fs.access(this.stateFile);
            } catch {
                await fs.writeFile(this.stateFile, JSON.stringify({ guilds: {} }, null, 2));
            }
        } catch (error) {
            console.error('Error initializing guild state storage:', error);
            throw error;
        }
    }

    /**
     * Load guild state data
     */
    async loadGuildState() {
        try {
            const data = await fs.readFile(this.stateFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading guild state:', error);
            return { guilds: {} };
        }
    }

    /**
     * Save guild state data
     */
    async saveGuildState(data) {
        try {
            await fs.writeFile(this.stateFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving guild state:', error);
            throw error;
        }
    }

    /**
     * Get current guild state
     */
    async getGuildState(guildId) {
        try {
            const stateData = await this.loadGuildState();
            return stateData.guilds[guildId] || {
                setupStatus: 'none',
                roles: {},
                channels: {},
                categories: {},
                lastUpdate: null,
                errors: []
            };
        } catch (error) {
            console.error('Error getting guild state:', error);
            return {
                setupStatus: 'none',
                roles: {},
                channels: {},
                categories: {},
                lastUpdate: null,
                errors: []
            };
        }
    }

    /**
     * Update guild state
     */
    async updateGuildState(guildId, guildName, updates) {
        try {
            await this.initializeStateStorage();
            const stateData = await this.loadGuildState();
            
            if (!stateData.guilds[guildId]) {
                stateData.guilds[guildId] = {
                    guildName,
                    setupStatus: 'none',
                    roles: {},
                    channels: {},
                    categories: {},
                    lastUpdate: null,
                    errors: []
                };
            }

            // Merge updates
            Object.assign(stateData.guilds[guildId], updates);
            stateData.guilds[guildId].lastUpdate = new Date().toISOString();
            stateData.guilds[guildId].guildName = guildName; // Update in case guild name changed

            await this.saveGuildState(stateData);
            return stateData.guilds[guildId];
        } catch (error) {
            console.error('Error updating guild state:', error);
            throw error;
        }
    }

    /**
     * Mark role as created/existing in state
     */
    async markRoleState(guildId, guildName, roleName, roleId, status = 'created') {
        const currentState = await this.getGuildState(guildId);
        currentState.roles[roleName] = {
            id: roleId,
            status,
            timestamp: new Date().toISOString()
        };
        
        return await this.updateGuildState(guildId, guildName, {
            roles: currentState.roles
        });
    }

    /**
     * Mark category as created/existing in state
     */
    async markCategoryState(guildId, guildName, categoryName, categoryId, status = 'created') {
        const currentState = await this.getGuildState(guildId);
        currentState.categories[categoryName] = {
            id: categoryId,
            status,
            timestamp: new Date().toISOString()
        };
        
        return await this.updateGuildState(guildId, guildName, {
            categories: currentState.categories
        });
    }

    /**
     * Mark channel as created/existing in state
     */
    async markChannelState(guildId, guildName, channelName, channelId, categoryId, status = 'created') {
        const currentState = await this.getGuildState(guildId);
        currentState.channels[channelName] = {
            id: channelId,
            categoryId,
            status,
            timestamp: new Date().toISOString()
        };
        
        return await this.updateGuildState(guildId, guildName, {
            channels: currentState.channels
        });
    }

    /**
     * Record an error in guild state
     */
    async recordError(guildId, guildName, error, context) {
        const currentState = await this.getGuildState(guildId);
        const errorEntry = {
            timestamp: new Date().toISOString(),
            context,
            message: error.message,
            code: error.code,
            stack: error.stack
        };
        
        currentState.errors.push(errorEntry);
        
        // Keep only last 10 errors to prevent bloat
        if (currentState.errors.length > 10) {
            currentState.errors = currentState.errors.slice(-10);
        }
        
        return await this.updateGuildState(guildId, guildName, {
            errors: currentState.errors
        });
    }

    /**
     * Get missing roles that need to be created
     */
    async getMissingRoles(guildId, blueprintRoles) {
        const state = await this.getGuildState(guildId);
        return blueprintRoles.filter(role => {
            const roleState = state.roles[role.name];
            return !roleState || roleState.status === 'failed';
        });
    }

    /**
     * Get missing categories that need to be created
     */
    async getMissingCategories(guildId, blueprintCategories) {
        const state = await this.getGuildState(guildId);
        return blueprintCategories.filter(category => {
            const categoryState = state.categories[category.name];
            return !categoryState || categoryState.status === 'failed';
        });
    }

    /**
     * Get missing channels that need to be created
     */
    async getMissingChannels(guildId, blueprintChannels) {
        const state = await this.getGuildState(guildId);
        const missing = [];
        
        for (const category of blueprintChannels) {
            if (category.channels) {
                for (const channel of category.channels) {
                    const channelState = state.channels[channel.name];
                    if (!channelState || channelState.status === 'failed') {
                        missing.push({
                            ...channel,
                            categoryName: category.name
                        });
                    }
                }
            }
        }
        
        return missing;
    }

    /**
     * Mark setup as completed
     */
    async markSetupComplete(guildId, guildName) {
        return await this.updateGuildState(guildId, guildName, {
            setupStatus: 'completed'
        });
    }

    /**
     * Get actionable hint for Discord error codes
     */
    getErrorHint(error) {
        if (error.code === 50013) {
            return {
                title: "Missing Permissions",
                message: "The bot lacks the necessary permissions to complete this action.",
                suggestions: [
                    "• Ensure the bot has 'Manage Roles' permission for role creation",
                    "• Ensure the bot has 'Manage Channels' permission for channel creation", 
                    "• Check that the bot's role is positioned above the roles it needs to create",
                    "• Verify the bot has 'Administrator' permission or specific permissions for this server",
                    "• Ask a server administrator to review and update the bot's permissions"
                ]
            };
        } else if (error.code === 50001) {
            return {
                title: "Missing Access",
                message: "The bot cannot access the requested resource.",
                suggestions: [
                    "• Check if the bot can view the channel or category",
                    "• Ensure the bot hasn't been removed from the server",
                    "• Verify the bot's role permissions in server settings"
                ]
            };
        } else if (error.code === 50035) {
            return {
                title: "Invalid Form Body", 
                message: "The request contains invalid data.",
                suggestions: [
                    "• Check if role/channel names contain valid characters",
                    "• Ensure role colors are in valid hex format",
                    "• Verify all required fields are provided"
                ]
            };
        } else if (error.code === 30013) {
            return {
                title: "Maximum Guilds Reached",
                message: "The server has reached the maximum number of roles or channels.",
                suggestions: [
                    "• Remove unused roles or channels before running setup",
                    "• Consider upgrading your Discord server for higher limits"
                ]
            };
        } else if (error.code === 50024) {
            return {
                title: "Forum Channel Configuration Error",
                message: "There was an issue creating forum channels with the specified tags or configuration.",
                suggestions: [
                    "• This is usually caused by too many forum tags or invalid tag configuration",
                    "• The bot has automatically fallen back to creating text channels instead",
                    "• Forum channels have been created but some tags may be missing",
                    "• You can manually add forum tags later in Discord channel settings",
                    "• Re-run /setup to retry - the bot will skip existing channels and only retry failed ones"
                ]
            };
        }
        
        return {
            title: "Unknown Error",
            message: `An unexpected error occurred (Code: ${error.code || 'unknown'})`,
            suggestions: [
                "• Try running the setup command again",
                "• Check Discord's status page for known issues",
                "• Contact support if the issue persists"
            ]
        };
    }

    /**
     * Check if dry run mode is enabled
     */
    isDryRun() {
        return process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
    }

    /**
     * Log dry run action
     */
    logDryRun(action, details) {
        if (this.isDryRun()) {
            console.log(`[DRY RUN] ${action}:`, details);
            return true;
        }
        return false;
    }
}

module.exports = GuildStateManager;
