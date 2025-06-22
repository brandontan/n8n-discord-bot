const fs = require('fs').promises;
const path = require('path');
const GuildStateManager = require('./guildStateManager');

class RoleManager {
    constructor() {
        this.dataFile = path.join(__dirname, '../data/roleData.json');
        this.blueprintFile = path.join(__dirname, '../config/blueprint.json');
        this.stateManager = new GuildStateManager();
    }

    /**
     * Initialize role data storage
     */
    async initializeDataStorage() {
        try {
            const dataDir = path.dirname(this.dataFile);
            await fs.mkdir(dataDir, { recursive: true });
            
            // Check if role data file exists, create if not
            try {
                await fs.access(this.dataFile);
            } catch {
                await fs.writeFile(this.dataFile, JSON.stringify({ guilds: {} }, null, 2));
            }
        } catch (error) {
            console.error('Error initializing data storage:', error);
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
     * Load stored role data
     */
    async loadRoleData() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading role data:', error);
            return { guilds: {} };
        }
    }

    /**
     * Save role data to storage
     */
    async saveRoleData(data) {
        try {
            await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving role data:', error);
            throw error;
        }
    }

    /**
     * Setup roles for a guild based on blueprint with error handling and state tracking
     */
    async setupGuildRoles(guild) {
        const isDryRun = this.stateManager.isDryRun();
        const results = {
            success: true,
            created: [],
            skipped: [],
            failed: [],
            errors: [],
            total: 0
        };

        try {
            console.log(`${isDryRun ? '[DRY RUN] ' : ''}Setting up roles for guild: ${guild.name}`);
            
            await this.initializeDataStorage();
            const blueprint = await this.loadBlueprint();
            const roleData = await this.loadRoleData();
            
            // Initialize guild data if not exists
            if (!roleData.guilds[guild.id]) {
                roleData.guilds[guild.id] = {
                    name: guild.name,
                    roles: {},
                    setupDate: new Date().toISOString()
                };
            }

            const guildData = roleData.guilds[guild.id];
            results.total = blueprint.roles.length;

            // Get missing roles that need to be created/fixed
            const missingRoles = await this.stateManager.getMissingRoles(guild.id, blueprint.roles);
            
            if (missingRoles.length === 0) {
                console.log('All roles already exist and are properly configured.');
                // Still update skipped count for existing roles
                for (const roleConfig of blueprint.roles) {
                    results.skipped.push(roleConfig.name);
                }
                return results;
            }

            if (isDryRun) {
                console.log(`[DRY RUN] Would create ${missingRoles.length} roles:`);
                missingRoles.forEach(role => {
                    console.log(`[DRY RUN] - ${role.name} (color: ${role.color})`);
                });
                results.created = missingRoles.map(role => role.name);
                return results;
            }

            // Get bot's highest role position to ensure hierarchy
            const botMember = await guild.members.fetch(guild.client.user.id);
            const botHighestRole = botMember.roles.highest;
            let nextPosition = Math.max(1, botHighestRole.position - 1);

            for (const roleConfig of blueprint.roles) {
                try {
                    // Check if role already exists
                    let existingRole = guild.roles.cache.find(role => role.name === roleConfig.name);
                    
                    if (existingRole) {
                        console.log(`Role '${roleConfig.name}' already exists, skipping creation`);
                        results.skipped.push(roleConfig.name);
                        
                        // Update stored data with existing role
                        guildData.roles[roleConfig.name] = {
                            id: existingRole.id,
                            position: existingRole.position,
                            color: existingRole.hexColor,
                            createdAt: guildData.roles[roleConfig.name]?.createdAt || new Date().toISOString()
                        };
                        
                        // Mark in state as existing
                        await this.stateManager.markRoleState(guild.id, guild.name, roleConfig.name, existingRole.id, 'existing');
                        continue;
                    }

                    // Create new role with error handling
                    console.log(`Creating role: ${roleConfig.name}`);
                    
                    const newRole = await guild.roles.create({
                        name: roleConfig.name,
                        color: roleConfig.color,
                        mentionable: roleConfig.mentionable,
                        position: nextPosition,
                        reason: 'n8n Discord Bot - Blueprint Role Setup'
                    });

                    // Store role data
                    guildData.roles[roleConfig.name] = {
                        id: newRole.id,
                        position: newRole.position,
                        color: newRole.hexColor,
                        createdAt: new Date().toISOString()
                    };

                    // Mark in state as created
                    await this.stateManager.markRoleState(guild.id, guild.name, roleConfig.name, newRole.id, 'created');
                    
                    results.created.push(roleConfig.name);
                    nextPosition--; // Next role should be lower in hierarchy
                    
                    // Small delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (roleError) {
                    console.error(`Error creating role '${roleConfig.name}':`, roleError);
                    
                    // Record error in state
                    await this.stateManager.recordError(guild.id, guild.name, roleError, `Creating role: ${roleConfig.name}`);
                    
                    // Add to failed results
                    results.failed.push(roleConfig.name);
                    
                    // Get actionable error hint
                    const errorHint = this.stateManager.getErrorHint(roleError);
                    results.errors.push({
                        role: roleConfig.name,
                        error: roleError.message,
                        code: roleError.code,
                        hint: errorHint
                    });
                    
                    // Mark as failed in state
                    await this.stateManager.markRoleState(guild.id, guild.name, roleConfig.name, null, 'failed');
                }
            }

            // Save updated role data
            await this.saveRoleData(roleData);

            console.log(`Role setup complete for ${guild.name}:`);
            console.log(`- Created: ${results.created.length} roles`);
            console.log(`- Skipped: ${results.skipped.length} roles`);
            console.log(`- Failed: ${results.failed.length} roles`);

            if (results.failed.length === 0) {
                await this.stateManager.markSetupComplete(guild.id, guild.name);
            }

            return results;

        } catch (error) {
            console.error('Error setting up guild roles:', error);
            
            // Record error in state
            await this.stateManager.recordError(guild.id, guild.name, error, 'Role setup - general error');
            
            results.success = false;
            results.errors.push({
                role: 'GENERAL',
                error: error.message,
                code: error.code,
                hint: this.stateManager.getErrorHint(error)
            });
            
            return results;
        }
    }

    /**
     * Get role by name from stored data
     */
    async getRoleId(guildId, roleName) {
        try {
            const roleData = await this.loadRoleData();
            return roleData.guilds[guildId]?.roles[roleName]?.id || null;
        } catch (error) {
            console.error('Error getting role ID:', error);
            return null;
        }
    }

    /**
     * Assign Pro Builder role to users with n8n Pro Builder tag
     * (Future automation hook)
     */
    async assignProBuilderRole(guild, userId) {
        try {
            const proBuilderRoleId = await this.getRoleId(guild.id, 'Pro Builder');
            if (!proBuilderRoleId) {
                console.log('Pro Builder role not found');
                return false;
            }

            const member = await guild.members.fetch(userId);
            const role = guild.roles.cache.get(proBuilderRoleId);
            
            if (role && !member.roles.cache.has(proBuilderRoleId)) {
                await member.roles.add(role, 'n8n Pro Builder tag detected');
                console.log(`Assigned Pro Builder role to ${member.user.tag}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error assigning Pro Builder role:', error);
            return false;
        }
    }

    /**
     * Get all stored guild role data
     */
    async getGuildRoleData(guildId) {
        try {
            const roleData = await this.loadRoleData();
            return roleData.guilds[guildId] || null;
        } catch (error) {
            console.error('Error getting guild role data:', error);
            return null;
        }
    }

    /**
     * Remove role data for a guild (cleanup)
     */
    async removeGuildData(guildId) {
        try {
            const roleData = await this.loadRoleData();
            if (roleData.guilds[guildId]) {
                delete roleData.guilds[guildId];
                await this.saveRoleData(roleData);
                console.log(`Removed data for guild: ${guildId}`);
            }
        } catch (error) {
            console.error('Error removing guild data:', error);
        }
    }
}

module.exports = RoleManager;
