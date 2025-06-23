require('dotenv').config();

// Environment validation
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN environment variable is required');
    console.error('Please set your Discord bot token in the environment variables.');
    process.exit(1);
}

const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const RoleManager = require('./modules/roleManager');
const ChannelManager = require('./modules/channelManager');
const SpotlightManager = require('./modules/spotlightManager');
const GuildStateManager = require('./modules/guildStateManager');
const OnboardingManager = require('./modules/onboardingManager');
const GamificationManager = require('./modules/gamificationManager');
const CommunityManager = require('./modules/communityManager');
const { assignRoleCommand, removeRoleCommand, listRolesCommand, syncProBuilderCommand } = require('./commands/roleCommands');
const { listChannelsCommand, channelInfoCommand, syncChannelPermissionsCommand, interviewCommand } = require('./commands/channelCommands');
const { testSpotlightCommand, spotlightStatusCommand, spotlightConfigCommand, spotlightControlCommand } = require('./commands/spotlightCommands');
const { manualOnboardingCommand, onboardingStatusCommand, onboardingStatsCommand, reOnboardCommand, testWelcomeCommand, testInteractiveCommand, createWelcomeCommand } = require('./commands/onboardingCommands');
const { reactionRoleCommand, pollCommand, skillAssessmentCommand, autoModCommand, interactiveHelpCommand, activityCommand, leaderboardCommand, moneyCommand } = require('./commands/interactiveCommands');
const { progressCommand, levelInfoCommand, badgesCommand, rewardsCommand, awardPointsCommand, discoverCommand, challengesCommand, enhancedProfileCommand, weeklyProgressCommand, motivationCommand } = require('./commands/gamificationCommands');
const InteractiveHandler = require('./handlers/interactiveHandler');
const { faqCommand, signboardCommand, showcaseCommand, tipCommand, slotCommand, eightBallCommand, celebrateCommand, moodCommand } = require('./commands/vegasCommands');
const VegasHandler = require('./handlers/vegasHandler');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

// Initialize managers
const roleManager = new RoleManager();
const channelManager = new ChannelManager();
const spotlightManager = new SpotlightManager();
const stateManager = new GuildStateManager();
const onboardingManager = new OnboardingManager();
const gamificationManager = new GamificationManager();
const communityManager = new CommunityManager();
const interactiveHandler = new InteractiveHandler();
const vegasHandler = new VegasHandler();

// Define the /setup slash command
const setupCommand = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup n8n workflow builder for this Discord server');

client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}!`);
    
    // Initialize spotlight manager with client
    spotlightManager.setClient(client);
    
    // Start the weekly spotlight automation
    spotlightManager.start();
    console.log('Weekly Spotlight automation started');
    
    // Wait a moment for guild cache to populate
    setTimeout(async () => {
        // Register the slash command
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        try {
            console.log('Registering slash commands...');
            console.log(`Found ${client.guilds.cache.size} guilds`);
            
            const commands = [
                setupCommand.toJSON(),
                communityManager.getSetupCommunityCommand().toJSON(),
                assignRoleCommand.toJSON(),
                removeRoleCommand.toJSON(),
                listRolesCommand.toJSON(),
                syncProBuilderCommand.toJSON(),
                listChannelsCommand.toJSON(),
                channelInfoCommand.toJSON(),
                syncChannelPermissionsCommand.toJSON(),
                interviewCommand.toJSON(),
                testSpotlightCommand.toJSON(),
                spotlightStatusCommand.toJSON(),
                spotlightConfigCommand.toJSON(),
                spotlightControlCommand.toJSON(),
                manualOnboardingCommand.toJSON(),
                onboardingStatusCommand.toJSON(),
                onboardingStatsCommand.toJSON(),
                reOnboardCommand.toJSON(),
                testWelcomeCommand.toJSON(),
                testInteractiveCommand.toJSON(),
                createWelcomeCommand.toJSON(),
                reactionRoleCommand.toJSON(),
                pollCommand.toJSON(),
                skillAssessmentCommand.toJSON(),
                autoModCommand.toJSON(),
                interactiveHelpCommand.toJSON(),
                activityCommand.toJSON(),
                leaderboardCommand.toJSON(),
                moneyCommand.toJSON(),
                progressCommand.toJSON(),
                levelInfoCommand.toJSON(),
                badgesCommand.toJSON(),
                rewardsCommand.toJSON(),
                awardPointsCommand.toJSON(),
                discoverCommand.toJSON(),
                challengesCommand.toJSON(),
                enhancedProfileCommand.toJSON(),
                weeklyProgressCommand.toJSON(),
                motivationCommand.toJSON(),
                faqCommand.toJSON(),
                signboardCommand.toJSON(),
                showcaseCommand.toJSON(),
                tipCommand.toJSON(),
                slotCommand.toJSON(),
                eightBallCommand.toJSON(),
                celebrateCommand.toJSON(),
                moodCommand.toJSON()
            ];
            
            if (client.guilds.cache.size === 0) {
                console.log('No guilds found yet, registering global commands as fallback');
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commands }
                );
                console.log('Global commands registered');
            } else {
                for (const guild of client.guilds.cache.values()) {
                    await rest.put(
                        Routes.applicationGuildCommands(client.user.id, guild.id),
                        { body: commands }
                    );
                    console.log(`Registered commands for guild: ${guild.name}`);
                }
            }
        } catch (error) {
            console.error('Error registering slash commands:', error);
        }
    }, 2000); // Wait 2 seconds for guilds to load
});

// Handle new members joining
client.on('guildMemberAdd', async member => {
    try {
        await onboardingManager.handleNewMember(member);
    } catch (error) {
        console.error('Error handling new member:', error);
    }
});

// Handle reactions for gamification points
client.on('messageReactionAdd', async (reaction, user) => {
    // Award points for helpful reactions
    if (user.bot) return;
    
    const helpfulEmojis = ['👍', '❤️', '🎯', '💡', '🔥', '⭐', '✅', '🚀', '💯'];
    if (helpfulEmojis.includes(reaction.emoji.name)) {
        try {
            const result = await gamificationManager.addHelpfulnessPoints(
                reaction.message.author.id, 
                5, 
                'helpful_reaction'
            );
            
            // Check for pending notifications and send them
            const notifications = gamificationManager.getAndClearPendingNotifications();
            if (notifications.levelUps.length > 0 || notifications.badges.length > 0) {
                await sendGamificationNotifications(notifications, reaction.message.guild);
            }
        } catch (error) {
            console.error('Error awarding points for reaction:', error);
        }
    }
});

client.on('interactionCreate', async interaction => {
    // Handle button interactions
    if (interaction.isButton()) {
        const customId = interaction.customId;
        
        // Handle onboarding start button
        if (customId.startsWith('start_onboarding_')) {
            const userId = customId.split('_')[2];
            if (userId === interaction.user.id) {
                await onboardingManager.handleStartOnboarding(interaction);
            } else {
                await interaction.reply({
                    content: '❌ This onboarding session is not for you.',
                    ephemeral: true
                });
            }
            return;
        }
        
        // Handle multi-select toggle buttons
        if (customId.startsWith('onboard_multi_')) {
            const parts = customId.split('_');
            const questionIndex = parseInt(parts[2]);
            const optionId = parts[3];
            const userId = parts[4];
            
            if (userId === interaction.user.id) {
                await onboardingManager.handleMultiSelectToggle(interaction, questionIndex, optionId);
            } else {
                await interaction.reply({
                    content: '❌ This onboarding session is not for you.',
                    ephemeral: true
                });
            }
            return;
        }
        
        // Handle continue buttons
        if (customId.startsWith('onboard_continue_')) {
            const parts = customId.split('_');
            const questionIndex = parseInt(parts[2]);
            const userId = parts[3];
            
            if (userId === interaction.user.id) {
                await onboardingManager.handleQuestionResponse(interaction, questionIndex, []);
            } else {
                await interaction.reply({
                    content: '❌ This onboarding session is not for you.',
                    ephemeral: true
                });
            }
            return;
        }
        
        // Handle skip buttons
        if (customId.startsWith('onboard_skip_')) {
            const parts = customId.split('_');
            const questionIndex = parseInt(parts[2]);
            const userId = parts[3];
            
            if (userId === interaction.user.id) {
                await onboardingManager.handleQuestionResponse(interaction, questionIndex, []);
            } else {
                await interaction.reply({
                    content: '❌ This onboarding session is not for you.',
                    ephemeral: true
                });
            }
            return;
        }
        
        // Handle interactive command buttons
        if (customId.startsWith('money_')) {
            await interactiveHandler.handleMoneyButtonInteraction(interaction);
            return;
        }
        
        if (customId.startsWith('profile_')) {
            // Handle profile buttons (edit, add showcase, etc.)
            if (customId === 'profile_edit') {
                // Show profile edit modal - implement later
                await interaction.reply({
                    content: '⚠️ Profile editing modal coming soon! Use `/profile edit` for now.',
                    ephemeral: true
                });
            } else if (customId === 'profile_add_showcase') {
                // Show add showcase modal - implement later
                await interaction.reply({
                    content: '⚠️ Project showcase modal coming soon! Use `/profile showcase` for now.',
                    ephemeral: true
                });
            }
            return;
        }
        
        // Handle welcome interactive buttons
        if (customId === 'welcome_start_onboarding') {
            await onboardingManager.handleStartOnboarding(interaction);
            return;
        }
        
        if (customId === 'welcome_go_intro') {
            const introChannel = interaction.guild.channels.cache.find(ch => ch.name === 'introductions');
            if (introChannel) {
                await interaction.reply({
                    content: `🚀 Great choice! Head over to ${introChannel} to introduce yourself to the community!`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '🚀 Time to introduce yourself! Look for the introductions channel to share your story!',
                    ephemeral: true
                });
            }
            return;
        }
        
        if (customId === 'welcome_quick_role') {
            const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('quick_role_select')
                .setPlaceholder('Choose your role...')
                .addOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🛠️ Freelancer')
                        .setDescription('I offer automation services')
                        .setValue('freelancer')
                        .setEmoji('🛠️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('📦 Client')
                        .setDescription('I need automation solutions')
                        .setValue('client')
                        .setEmoji('📦'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🎓 Learning')
                        .setDescription('I\'m learning automation')
                        .setValue('learner')
                        .setEmoji('🎓'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('🏢 Agency')
                        .setDescription('I run an automation agency')
                        .setValue('agency')
                        .setEmoji('🏢')
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
                content: '🎯 **Quick Role Selection**\n\nChoose your role to get instant access to relevant channels!',
                components: [row],
                ephemeral: true
            });
            return;
        }
        
        if (customId === 'welcome_get_help') {
            const helpText = [
                '🚀 **Welcome to the n8n Automation Community!**\n',
                '📚 **Getting Started:**',
                '• Complete onboarding for personalized experience',
                '• Introduce yourself in #introductions',
                '• Browse channels that match your interests\n',
                '🔧 **Need Technical Help?**',
                '• #integration-issues - API and connection problems',
                '• #advanced-expressions - Complex logic and coding',
                '• #general-chat - Quick questions and discussions\n',
                '🎯 **Looking for Work/Talent?**',
                '• #post-a-job - Clients post projects',
                '• #available-for-hire - Freelancers showcase skills',
                '• #project-portfolio - View completed work\n',
                '🤝 **Community Guidelines:**',
                '• Be helpful and respectful',
                '• Share knowledge freely',
                '• Use appropriate channels for topics',
                '• Search before posting duplicates'
            ];
            
            await interaction.reply({
                content: helpText.join('\n'),
                ephemeral: true
            });
            return;
        }
    }
    
    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
        const customId = interaction.customId;
        
        // Handle onboarding select menus
        if (customId.startsWith('onboard_select_')) {
            const parts = customId.split('_');
            const questionIndex = parseInt(parts[2]);
            const userId = parts[3];
            
            if (userId === interaction.user.id) {
                const selectedValues = interaction.values;
                await onboardingManager.handleQuestionResponse(interaction, questionIndex, selectedValues);
            } else {
                await interaction.reply({
                    content: '❌ This onboarding session is not for you.',
                    ephemeral: true
                });
            }
            return;
        }
        
        // Handle quick role selection
        if (customId === 'quick_role_select') {
            const selectedRole = interaction.values[0];
            const responses = { user_type: selectedRole };
            
            await interaction.reply({
                content: '🔄 Processing your role selection...',
                ephemeral: true
            });
            
            try {
                const result = await onboardingManager.completeOnboarding(interaction.member, responses);
                
                if (result.success) {
                    await interaction.followUp({
                        content: `✅ **Role Assigned Successfully!**\n\n` +
                                `**Your Role:** ${result.roles.join(', ') || 'Community Member'}\n` +
                                `**Recommended Channels:** ${result.channels.length} channels\n\n` +
                                `💡 For a complete personalized experience, try \`/test-interactive\` to answer all onboarding questions!`,
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ **Role Assignment Failed**\n\n${result.error}`,
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error during quick role assignment:', error);
                await interaction.followUp({
                    content: '❌ An error occurred during role assignment. Please try again later.',
                    ephemeral: true
                });
            }
            return;
        }
    }
    
    // Handle modal submissions
    if (interaction.isModalSubmit()) {
        const customId = interaction.customId;
        
        if (customId === 'money_quick_update_modal') {
            // Handle the financial quick update modal
            const revenue = interaction.fields.getTextInputValue('revenue_input');
            const projects = interaction.fields.getTextInputValue('projects_input');
            const rate = interaction.fields.getTextInputValue('rate_input');
            
            const userId = interaction.user.id;
            const userData = await interactiveHandler.getUserFinancialData(userId);
            
            if (revenue) userData.monthlyRevenue = parseFloat(revenue);
            if (projects) userData.monthlyProjects = parseInt(projects);
            if (rate) userData.hourlyRate = parseFloat(rate);
            
            await interactiveHandler.saveUserFinancialData(userId, userData);
            
            await interaction.reply({
                content: '✅ **Financial Data Updated Successfully!**\n\n' +
                        (revenue ? `💰 Monthly Revenue: $${parseFloat(revenue).toLocaleString()}\n` : '') +
                        (projects ? `📊 Projects: ${projects}\n` : '') +
                        (rate ? `💵 Hourly Rate: $${parseFloat(rate).toLocaleString()}/hr\n` : '') +
                        '\nGreat work! Keep tracking your progress!',
                ephemeral: true
            });
            return;
        }
    }
    
    if (!interaction.isChatInputCommand()) return;
    
    console.log(`[INTERACTION] Command received: ${interaction.commandName} from user: ${interaction.user.tag}`);
    
    if (interaction.commandName === 'setup') {
        console.log(`[SETUP] Setup command started by ${interaction.user.tag} (ID: ${interaction.user.id})`);
        console.log(`[SETUP] Guild owner ID: ${interaction.guild.ownerId}`);
        console.log(`[SETUP] User is owner: ${interaction.user.id === interaction.guild.ownerId}`);
        
        try {
            // Check if the user is the server owner
            if (interaction.user.id !== interaction.guild.ownerId) {
                await interaction.reply({
                    content: 'Only the server owner can use this command.',
                    ephemeral: true
                });
                return;
            }
            
            console.log('[SETUP] Owner check passed, sending immediate reply...');
            
            // Send immediate response to prevent timeout
            await interaction.reply({
                content: '🎨 **Setup Started!** 🚀\n\n⏱️ Working on it... This will take a moment!',
                ephemeral: true
            });
            
            console.log('[SETUP] Initial reply sent successfully');
            
            const isDryRun = stateManager.isDryRun();
            console.log(`${isDryRun ? '[DRY RUN] ' : ''}Setup processing for guild: ${interaction.guild.name}`);
            
            // Check Community feature status first
            const guild = interaction.guild;
            const guildFeatures = guild.features || [];
            const hasCommunity = guildFeatures.includes('COMMUNITY');
            
            console.log(`[SETUP] Guild features: ${guildFeatures.join(', ') || 'None'}`);
            console.log(`[SETUP] Community feature enabled: ${hasCommunity ? 'YES' : 'NO'}`);
            
            if (!hasCommunity) {
                await interaction.editReply({
                    content: '⚠️ **Community Feature Required** ⚠️\n\n' +
                            '🚨 Your Discord server needs **Community features** enabled to create forum channels!\n\n' +
                            '**How to fix:**\n' +
                            '1. Go to **Server Settings**\n' +
                            '2. Click **"Enable Community"**\n' +
                            '3. Complete the setup wizard\n' +
                            '4. Run `/setup` again\n\n' +
                            '⏱️ This will enable forum channels, better organization, and community features!\n\n' +
                            '🔄 **Proceeding with text channels for now...**'
                });
                // Continue setup but with warning
            }
            
            // Update with progress
            await interaction.editReply({
                content: `🎨 **Setup Started!** 🚀\n\n` +
                        `${hasCommunity ? '✅ Community features detected!' : '⚠️ Community features missing (forum channels will be text channels)'} \n\n` +
                        `🗑️ **Step 1:** Cleaning up old structure...`
            });
            // Step 1: Clean up existing bot-created categories for fresh rebuild
            await interaction.editReply({
                content: `${isDryRun ? '🧪 **[DRY RUN MODE]** ' : ''}🎨 **Enhanced Community Setup Initiated!** 🚀\n\n` +
                        `🗑️ **Step 1:** Cleaning up old structure...\n` +
                        `⏱️ This may take a moment...`
            });
            
            const cleanupResult = await channelManager.deleteExistingBotCategories(interaction.guild);
            
            // Step 2: Setup roles based on blueprint with error handling
            await interaction.editReply({
                content: `${isDryRun ? '🧪 **[DRY RUN MODE]** ' : ''}🎨 **Enhanced Community Setup Initiated!** 🚀\n\n` +
                        `✅ **Step 1:** Cleanup complete (${cleanupResult.deletedCategories.length} categories, ${cleanupResult.deletedChannelsCount} channels)\n` +
                        `🎭 **Step 2:** Setting up roles...\n` +
                        `⏱️ Almost there...`
            });
            
            const roleResult = await roleManager.setupGuildRoles(interaction.guild);
            
            // Step 3: Setup channels and categories based on blueprint with error handling
            await interaction.editReply({
                content: `${isDryRun ? '🧪 **[DRY RUN MODE]** ' : ''}🎨 **Enhanced Community Setup Initiated!** 🚀\n\n` +
                        `✅ **Step 1:** Cleanup complete\n` +
                        `✅ **Step 2:** Roles configured (${roleResult.created.length} created)\n` +
                        `🎨 **Step 3:** Creating forum channels with tags...\n` +
                        `⏱️ Building your amazing community!`
            });
            
            const channelResult = await channelManager.setupGuildChannels(interaction.guild);
            
            // Create comprehensive results message with error handling
            const resultMessage = [
                `${isDryRun ? '🧪 **[DRY RUN]** ' : ''}🎉 **Enhanced Community Setup ${roleResult.success && channelResult.success ? 'Complete' : 'Completed with Issues'}!** 🌟\n`,
                cleanupResult.deletedCategories.length > 0 ? `🗑️ **Cleanup:** ${isDryRun ? 'Would delete' : 'Deleted'} ${cleanupResult.deletedCategories.length} old categories\n` : '',
                '**📋 Role Setup:**',
                `• Total roles in blueprint: ${roleResult.total}`,
                `• Created: ${roleResult.created.length} new roles`,
                `• Skipped: ${roleResult.skipped.length} existing roles`,
                `• Failed: ${roleResult.failed.length} roles`,
                '',
                '**🏗️ Channel Setup:**',
                `• Total categories: ${channelResult.totalCategories}`,
                `• Created categories: ${channelResult.createdCategories.length}`,
                `• Skipped categories: ${channelResult.skippedCategories.length}`,
                `• Failed categories: ${channelResult.failedCategories.length}`,
                `• Total channels: ${channelResult.totalChannels}`,
                `• Created channels: ${channelResult.createdChannels.length}`,
                `• Skipped channels: ${channelResult.skippedChannels.length}`,
                `• Failed channels: ${channelResult.failedChannels.length}`,
                ''
            ];
            
            if (roleResult.created.length > 0) {
                resultMessage.push('**🆕 Created Roles:**');
                roleResult.created.forEach(role => {
                    resultMessage.push(`• ${role}`);
                });
                resultMessage.push('');
            }
            
            if (channelResult.createdCategories.length > 0) {
                resultMessage.push('**🆕 Created Categories:**');
                channelResult.createdCategories.forEach(category => {
                    resultMessage.push(`• ${category}`);
                });
                resultMessage.push('');
            }
            
            if (channelResult.createdChannels.length > 0) {
                resultMessage.push('**🆕 Created Channels:**');
                channelResult.createdChannels.forEach(channel => {
                    resultMessage.push(`• ${channel}`);
                });
                resultMessage.push('');
            }
            
            // Handle errors with actionable hints
            const allErrors = [...roleResult.errors, ...channelResult.errors];
            if (allErrors.length > 0) {
                resultMessage.push('**⚠️ Issues Encountered:**');
                
                // Group errors by type for better presentation
                const errorsByCode = {};
                allErrors.forEach(error => {
                    if (!errorsByCode[error.code]) {
                        errorsByCode[error.code] = {
                            hint: error.hint,
                            items: []
                        };
                    }
                    const itemName = error.role || error.channel || error.category || 'Unknown';
                    errorsByCode[error.code].items.push(itemName);
                });
                
                for (const [code, errorGroup] of Object.entries(errorsByCode)) {
                    resultMessage.push(`\n**${errorGroup.hint.title} (Code: ${code})**`);
                    resultMessage.push(errorGroup.hint.message);
                    resultMessage.push(`Failed items: ${errorGroup.items.join(', ')}`);
                    resultMessage.push('\n**How to fix:**');
                    errorGroup.hint.suggestions.forEach(suggestion => {
                        resultMessage.push(suggestion);
                    });
                    resultMessage.push('');
                }
                
                resultMessage.push('💡 **Tip:** Run `/setup` again after fixing permissions to retry failed items only.');
                resultMessage.push('');
            }
            
            if (allErrors.length === 0) {
                resultMessage.push(`${isDryRun ? '🧪 **Dry run completed successfully!** No actual changes were made.' : '🎯 **Ready for Amazing Community Engagement!** 🚀\n\n🌟 Your server now features:\n• Beautiful emoji-enhanced channels\n• Interactive forum discussions\n• Engaging community categories\n• Professional marketplace structure\n\n💡 Use role assignment commands to manage permissions!'}`);
            } else {
                resultMessage.push(`${isDryRun ? '🧪 **Dry run completed with simulated issues.**' : '⚠️ **Setup mostly complete!** Some items failed due to permission issues. See above for solutions.\n\n🎉 Your beautiful channels are ready for community engagement!'}`);
            }
            
            // Send final comprehensive results - use editReply for the final status
            const messageContent = resultMessage.join('\n');
            if (messageContent.length > 2000) {
                // For long messages, edit the reply with summary and send details as follow-up
                const summaryMessage = [
                    `${isDryRun ? '🧪 **[DRY RUN]** ' : ''}🎉 **Enhanced Community Setup ${roleResult.success && channelResult.success ? 'Complete' : 'Completed with Issues'}!** 🌟\n`,
                    '**📋 Summary:**',
                    `• Roles: ${roleResult.created.length} created, ${roleResult.failed.length} failed`,
                    `• Categories: ${channelResult.createdCategories.length} created, ${channelResult.failedCategories.length} failed`,
                    `• Channels: ${channelResult.createdChannels.length} created, ${channelResult.failedChannels.length} failed`,
                    '',
                    allErrors.length === 0 ? 
                        `${isDryRun ? '🧪 **Dry run completed successfully!** No actual changes were made.' : '🎯 **Ready for Amazing Community Engagement!** 🚀\n\nYour server now features beautiful emoji-enhanced channels, interactive forum discussions, and professional marketplace structure!'}` :
                        '⚠️ **Setup mostly complete!** Some items failed due to permission issues. See detailed report below.',
                    '',
                    '📋 **Detailed report sent as follow-up message...**'
                ];
                
                await interaction.editReply({
                    content: summaryMessage.join('\n')
                });
                
                // Send detailed chunks as follow-up
                const chunks = [];
                let currentChunk = '';
                
                resultMessage.forEach(line => {
                    if ((currentChunk + line + '\n').length > 1900) {
                        chunks.push(currentChunk);
                        currentChunk = line + '\n';
                    } else {
                        currentChunk += line + '\n';
                    }
                });
                
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                
                // Send remaining chunks with a small delay
                for (let i = 0; i < chunks.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await interaction.followUp({
                        content: chunks[i],
                        ephemeral: true
                    });
                }
            } else {
                await interaction.editReply({
                    content: messageContent
                });
            }
            
        } catch (error) {
            console.error('Error during setup:', error);
            
            // Get actionable hint for the error
            const errorHint = stateManager.getErrorHint(error);
            
            await interaction.followUp({
                content: `❌ **Setup Error Occurred**\n\n` +
                        `**${errorHint.title}**\n` +
                        `${errorHint.message}\n\n` +
                        `**How to fix:**\n` +
                        errorHint.suggestions.join('\n') +
                        `\n\n**Technical Details:**\n` +
                        `Error: ${error.message}\n` +
                        `Code: ${error.code || 'unknown'}`,
                ephemeral: true
            });
        }
    }
    
    // Handle setup-community command
    if (interaction.commandName === 'setup-community') {
        await communityManager.handleSetupCommunityCommand(interaction);
        return;
    }
    
    // Handle assign-role command
    if (interaction.commandName === 'assign-role') {
        const targetUser = interaction.options.getUser('user');
        const roleName = interaction.options.getString('role');
        
        try {
            const roleId = await roleManager.getRoleId(interaction.guild.id, roleName);
            if (!roleId) {
                await interaction.reply({
                    content: `❌ Role "${roleName}" not found. Please run /setup first.`,
                    ephemeral: true
                });
                return;
            }
            
            const member = await interaction.guild.members.fetch(targetUser.id);
            const role = interaction.guild.roles.cache.get(roleId);
            
            if (member.roles.cache.has(roleId)) {
                await interaction.reply({
                    content: `⚠️ ${targetUser.tag} already has the "${roleName}" role.`,
                    ephemeral: true
                });
                return;
            }
            
            await member.roles.add(role, `Role assigned by ${interaction.user.tag}`);
            
            await interaction.reply({
                content: `✅ Successfully assigned "${roleName}" role to ${targetUser.tag}`,
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error assigning role:', error);
            await interaction.reply({
                content: '❌ An error occurred while assigning the role.',
                ephemeral: true
            });
        }
    }
    
    // Handle remove-role command
    if (interaction.commandName === 'remove-role') {
        const targetUser = interaction.options.getUser('user');
        const roleName = interaction.options.getString('role');
        
        try {
            const roleId = await roleManager.getRoleId(interaction.guild.id, roleName);
            if (!roleId) {
                await interaction.reply({
                    content: `❌ Role "${roleName}" not found. Please run /setup first.`,
                    ephemeral: true
                });
                return;
            }
            
            const member = await interaction.guild.members.fetch(targetUser.id);
            const role = interaction.guild.roles.cache.get(roleId);
            
            if (!member.roles.cache.has(roleId)) {
                await interaction.reply({
                    content: `⚠️ ${targetUser.tag} doesn't have the "${roleName}" role.`,
                    ephemeral: true
                });
                return;
            }
            
            await member.roles.remove(role, `Role removed by ${interaction.user.tag}`);
            
            await interaction.reply({
                content: `✅ Successfully removed "${roleName}" role from ${targetUser.tag}`,
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error removing role:', error);
            await interaction.reply({
                content: '❌ An error occurred while removing the role.',
                ephemeral: true
            });
        }
    }
    
    // Handle list-roles command
    if (interaction.commandName === 'list-roles') {
        try {
            const guildData = await roleManager.getGuildRoleData(interaction.guild.id);
            if (!guildData) {
                await interaction.reply({
                    content: '❌ No role data found. Please run /setup first.',
                    ephemeral: true
                });
                return;
            }
            
            const roleInfo = [];
            roleInfo.push('📋 **n8n Workflow Roles:**\n');
            
            for (const [roleName, roleData] of Object.entries(guildData.roles)) {
                const role = interaction.guild.roles.cache.get(roleData.id);
                if (role) {
                    const memberCount = role.members.size;
                    roleInfo.push(`🔹 **${roleName}**`);
                    roleInfo.push(`   • Members: ${memberCount}`);
                    roleInfo.push(`   • Color: ${role.hexColor}`);
                    roleInfo.push(`   • Position: ${role.position}`);
                    roleInfo.push('');
                }
            }
            
            await interaction.reply({
                content: roleInfo.join('\n'),
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error listing roles:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching role information.',
                ephemeral: true
            });
        }
    }
    
    // Handle sync-pro-builder command (placeholder for future automation)
    if (interaction.commandName === 'sync-pro-builder') {
        await interaction.reply({
            content: '🔄 **Pro Builder Sync**\n\n' +
                     'This feature will automatically detect users with n8n Pro Builder tags ' +
                     'and assign them the "Pro Builder" role.\n\n' +
                     '⚠️ This functionality requires integration with n8n user data and will be ' +
                     'implemented in a future update.\n\n' +
                     'For now, please use `/assign-role` to manually assign the Pro Builder role.',
            ephemeral: true
        });
    }
    
    // Handle list-channels command
    if (interaction.commandName === 'list-channels') {
        try {
            const guildData = await channelManager.getGuildChannelData(interaction.guild.id);
            if (!guildData) {
                await interaction.reply({
                    content: '❌ No channel data found. Please run /setup first.',
                    ephemeral: true
                });
                return;
            }
            
            const channelInfo = [];
            channelInfo.push('🏗️ **n8n Discord Channels:**\n');
            
            // List categories and their channels
            for (const [categoryName, categoryData] of Object.entries(guildData.categories)) {
                const category = interaction.guild.channels.cache.get(categoryData.id);
                if (category) {
                    channelInfo.push(`📁 **${categoryName}** ${categoryData.private ? '🔒' : '🌐'}`);
                    
                    // Find channels in this category
                    const categoryChannels = [];
                    for (const [channelName, channelData] of Object.entries(guildData.channels)) {
                        if (channelData.categoryId === categoryData.id) {
                            const channel = interaction.guild.channels.cache.get(channelData.id);
                            if (channel) {
                                let channelType = '';
                                if (channel.type === 0) channelType = '💬'; // Text
                                else if (channel.type === 2) channelType = '🔊'; // Voice
                                else if (channel.type === 15) channelType = '💭'; // Forum
                                
                                categoryChannels.push(`   ${channelType} ${channelName}`);
                            }
                        }
                    }
                    
                    channelInfo.push(...categoryChannels);
                    channelInfo.push('');
                }
            }
            
            await interaction.reply({
                content: channelInfo.join('\n'),
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error listing channels:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching channel information.',
                ephemeral: true
            });
        }
    }
    
    // Handle channel-info command
    if (interaction.commandName === 'channel-info') {
        const channelName = interaction.options.getString('channel');
        
        try {
            const channelId = await channelManager.getChannelId(interaction.guild.id, channelName);
            if (!channelId) {
                await interaction.reply({
                    content: `❌ Channel "${channelName}" not found in bot data.`,
                    ephemeral: true
                });
                return;
            }
            
            const channel = interaction.guild.channels.cache.get(channelId);
            if (!channel) {
                await interaction.reply({
                    content: `❌ Channel "${channelName}" exists in data but not in Discord.`,
                    ephemeral: true
                });
                return;
            }
            
            let channelType = 'Unknown';
            if (channel.type === 0) channelType = 'Text Channel';
            else if (channel.type === 2) channelType = 'Voice Channel';
            else if (channel.type === 15) channelType = 'Forum Channel';
            else if (channel.type === 4) channelType = 'Category';
            
            const infoMessage = [
                `📋 **Channel Information: ${channelName}**\n`,
                `🔹 **Type:** ${channelType}`,
                `🔹 **ID:** ${channel.id}`,
                `🔹 **Created:** <t:${Math.floor(channel.createdTimestamp / 1000)}:F>`,
                `🔹 **Position:** ${channel.position}`,
            ];
            
            if (channel.parent) {
                infoMessage.push(`🔹 **Category:** ${channel.parent.name}`);
            }
            
            if (channel.topic) {
                infoMessage.push(`🔹 **Topic:** ${channel.topic}`);
            }
            
            // Show forum tags if it's a forum channel
            if (channel.type === 15 && channel.availableTags?.length > 0) {
                infoMessage.push(`🔹 **Available Tags:** ${channel.availableTags.map(tag => tag.name).join(', ')}`);
            }
            
            // Show permissions info
            const everyoneOverwrite = channel.permissionOverwrites.cache.get(interaction.guild.roles.everyone.id);
            if (everyoneOverwrite) {
                const canView = everyoneOverwrite.allow.has('ViewChannel') || !everyoneOverwrite.deny.has('ViewChannel');
                infoMessage.push(`🔹 **Public Access:** ${canView ? 'Yes' : 'No'}`);
            }
            
            await interaction.reply({
                content: infoMessage.join('\n'),
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error getting channel info:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching channel information.',
                ephemeral: true
            });
        }
    }
    
    // Handle sync-channel-permissions command
    if (interaction.commandName === 'sync-channel-permissions') {
        // Check if the user has permission to manage channels
        if (!interaction.member.permissions.has('ManageChannels')) {
            await interaction.reply({
                content: '❌ You need "Manage Channels" permission to use this command.',
                ephemeral: true
            });
            return;
        }
        
        await interaction.reply({
            content: '🔄 **Channel Permission Sync**\n\n' +
                     'This feature will sync all channel permissions based on the current blueprint configuration.\n\n' +
                     '⚠️ This functionality is planned for a future update and will:\n' +
                     '• Update existing channel permissions\n' +
                     '• Apply role-based access controls\n' +
                     '• Sync forum channel tags\n\n' +
                     'For now, please use the /setup command to recreate channels with updated permissions.',
            ephemeral: true
        });
    }
    
    // Handle interview command
    if (interaction.commandName === 'interview') {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'start') {
            // Check if the user has permission to manage channels or has admin/hiring role
            const hasPermission = interaction.member.permissions.has('ManageChannels') ||
                                interaction.member.roles.cache.some(role => 
                                    role.name.includes('Admin') || role.name.includes('Hiring')
                                );
            
            if (!hasPermission) {
                await interaction.reply({
                    content: '❌ You need "Manage Channels" permission or a hiring role to start interviews.',
                    ephemeral: true
                });
                return;
            }
            
            const candidate = interaction.options.getUser('candidate');
            const duration = interaction.options.getInteger('duration') || 7;
            
            try {
                // Find or create the "🔒 Client ↔ Talent" category
                let interviewCategory = interaction.guild.channels.cache.find(
                    channel => channel.type === 4 && channel.name === '🔒 Client ↔ Talent'
                );
                
                if (!interviewCategory) {
                    // Create the category if it doesn't exist
                    interviewCategory = await interaction.guild.channels.create({
                        name: '🔒 Client ↔ Talent',
                        type: 4, // Category
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone.id,
                                deny: ['ViewChannel']
                            }
                        ]
                    });
                }
                
                // Create the interview channel
                const channelName = `interview-${candidate.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                
                // Check if a channel already exists for this candidate
                const existingChannel = interaction.guild.channels.cache.find(
                    channel => channel.name === channelName && channel.parentId === interviewCategory.id
                );
                
                if (existingChannel) {
                    await interaction.reply({
                        content: `⚠️ An interview channel already exists for ${candidate.tag}: ${existingChannel}`,
                        ephemeral: true
                    });
                    return;
                }
                
                // Get admin and verified pro roles
                const adminRole = interaction.guild.roles.cache.find(role => role.name.includes('Admin'));
                const verifiedProRole = interaction.guild.roles.cache.find(role => role.name.includes('Verified Pro'));
                
                // Set up permissions
                const permissionOverwrites = [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: ['ViewChannel']
                    },
                    {
                        id: candidate.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                    },
                    {
                        id: interaction.user.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
                    }
                ];
                
                // Add admin role permissions if it exists
                if (adminRole) {
                    permissionOverwrites.push({
                        id: adminRole.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
                    });
                }
                
                // Add verified pro role permissions if it exists
                if (verifiedProRole) {
                    permissionOverwrites.push({
                        id: verifiedProRole.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                    });
                }
                
                const interviewChannel = await interaction.guild.channels.create({
                    name: channelName,
                    type: 0, // Text channel
                    parent: interviewCategory.id,
                    topic: `Private interview channel for ${candidate.tag} - Auto-delete in ${duration} days`,
                    permissionOverwrites
                });
                
                // Schedule auto-delete (store in a simple way for now)
                // In a production environment, you'd want to use a proper scheduler/database
                setTimeout(async () => {
                    try {
                        const channelToDelete = interaction.guild.channels.cache.get(interviewChannel.id);
                        if (channelToDelete) {
                            await channelToDelete.send('🗑️ This interview channel will be automatically deleted in 1 minute due to the scheduled cleanup.');
                            setTimeout(async () => {
                                try {
                                    await channelToDelete.delete('Automatic cleanup after interview period');
                                } catch (deleteError) {
                                    console.log('Channel may have already been deleted:', deleteError.message);
                                }
                            }, 60000); // 1 minute warning
                        }
                    } catch (error) {
                        console.log('Error during scheduled channel cleanup:', error.message);
                    }
                }, duration * 24 * 60 * 60 * 1000); // Convert days to milliseconds
                
                // Send welcome message to the interview channel
                await interviewChannel.send({
                    content: `👋 **Welcome to your interview session!**\n\n` +
                            `**Candidate:** ${candidate}\n` +
                            `**Interviewer:** ${interaction.user}\n` +
                            `**Started:** <t:${Math.floor(Date.now() / 1000)}:F>\n` +
                            `**Auto-delete:** <t:${Math.floor((Date.now() + (duration * 24 * 60 * 60 * 1000)) / 1000)}:R>\n\n` +
                            `🎯 **Purpose:** This is a private space for interview discussions and evaluation.\n` +
                            `📝 **Guidelines:**\n` +
                            `• Share your automation experience and portfolio\n` +
                            `• Discuss technical skills and project examples\n` +
                            `• Ask questions about opportunities and expectations\n\n` +
                            `⏰ This channel will be automatically archived after ${duration} days.`
                });
                
                await interaction.reply({
                    content: `✅ **Interview channel created successfully!**\n\n` +
                            `📍 **Channel:** ${interviewChannel}\n` +
                            `👤 **Candidate:** ${candidate.tag}\n` +
                            `⏰ **Auto-delete:** ${duration} days\n\n` +
                            `The candidate has been granted access and a welcome message has been posted.`,
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Error creating interview channel:', error);
                await interaction.reply({
                    content: '❌ An error occurred while creating the interview channel.',
                    ephemeral: true
                });
            }
        }
    }
    
    // Handle test-spotlight command
    if (interaction.commandName === 'test-spotlight') {
        // Check if the user has permission to manage messages
        if (!interaction.member.permissions.has('ManageMessages')) {
            await interaction.reply({
                content: '❌ You need "Manage Messages" permission to test the spotlight feature.',
                ephemeral: true
            });
            return;
        }
        
        await interaction.reply({
            content: '🔄 Triggering test spotlight post...',
            ephemeral: true
        });
        
        try {
            const success = await spotlightManager.triggerManualSpotlight(interaction.guild);
            
            if (success) {
                await interaction.followUp({
                    content: '✅ Test spotlight posted successfully! Check the #weekly-spotlight channel.',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: '❌ Failed to post test spotlight. Make sure a #weekly-spotlight channel exists.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error triggering test spotlight:', error);
            await interaction.followUp({
                content: '❌ An error occurred while posting the test spotlight.',
                ephemeral: true
            });
        }
    }
    
    // Handle spotlight-status command
    if (interaction.commandName === 'spotlight-status') {
        try {
            const status = spotlightManager.getStatus();
            const nextMonday = getNextMonday();
            
            const statusMessage = [
                '📊 **Weekly Spotlight Status**\n',
                `🔄 **Automation Status:** ${status.isRunning ? '✅ Running' : '❌ Stopped'}`,
                `📅 **Next Scheduled Run:** <t:${Math.floor(nextMonday.getTime() / 1000)}:F>`,
                `📈 **Spotlights Used This Cycle:** ${status.usedSpotlightsCount}`,
                `📆 **Current Week:** ${status.currentWeek}`,
                `🔄 **Last Reset Week:** ${status.lastResetWeek || 'Not yet reset'}`,
                '',
                '🎯 **How it works:**',
                '• Posts every Monday at 00:00 UTC',
                '• Automatically creates discussion threads',
                '• Manages pinned messages (keeps last 4)',
                '• Supports external data sources (n8n, Google Sheets)'
            ];
            
            await interaction.reply({
                content: statusMessage.join('\n'),
                ephemeral: true
            });
        } catch (error) {
            console.error('Error getting spotlight status:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching spotlight status.',
                ephemeral: true
            });
        }
    }
    
    // Handle spotlight-config command
    if (interaction.commandName === 'spotlight-config') {
        // Check if the user has administrator permission
        if (!interaction.member.permissions.has('Administrator')) {
            await interaction.reply({
                content: '❌ You need Administrator permission to configure spotlight settings.',
                ephemeral: true
            });
            return;
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'enable-n8n') {
            const webhookUrl = interaction.options.getString('webhook-url');
            
            try {
                const success = updateSpotlightConfig({
                    enable_n8n_integration: true,
                    n8n_webhook_url: webhookUrl
                });
                
                if (success) {
                    await interaction.reply({
                        content: `✅ **n8n Integration Enabled**\n\nWebhook URL: ${webhookUrl}\n\nThe spotlight automation will now try to fetch content from your n8n workflow before falling back to local data.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Failed to update spotlight configuration.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error configuring n8n integration:', error);
                await interaction.reply({
                    content: '❌ An error occurred while configuring n8n integration.',
                    ephemeral: true
                });
            }
        }
        
        if (subcommand === 'enable-gsheets') {
            const sheetUrl = interaction.options.getString('sheet-url');
            
            try {
                const success = updateSpotlightConfig({
                    enable_gsheets_integration: true,
                    gsheets_url: sheetUrl
                });
                
                if (success) {
                    await interaction.reply({
                        content: `✅ **Google Sheets Integration Enabled**\n\nSheet URL: ${sheetUrl}\n\nThe spotlight automation will now try to fetch content from your Google Sheet before falling back to local data.\n\n⚠️ **Note:** Make sure your Google Sheet is publicly accessible (Anyone with the link can view).`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Failed to update spotlight configuration.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error configuring Google Sheets integration:', error);
                await interaction.reply({
                    content: '❌ An error occurred while configuring Google Sheets integration.',
                    ephemeral: true
                });
            }
        }
        
        if (subcommand === 'disable-external') {
            try {
                const success = updateSpotlightConfig({
                    enable_n8n_integration: false,
                    enable_gsheets_integration: false,
                    n8n_webhook_url: '',
                    gsheets_url: ''
                });
                
                if (success) {
                    await interaction.reply({
                        content: '✅ **External Integrations Disabled**\n\nThe spotlight automation will now use only local spotlight data.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Failed to update spotlight configuration.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error disabling external integrations:', error);
                await interaction.reply({
                    content: '❌ An error occurred while disabling external integrations.',
                    ephemeral: true
                });
            }
        }
        
        if (subcommand === 'set-max-pins') {
            const count = interaction.options.getInteger('count');
            
            try {
                const success = updateSpotlightConfig({
                    max_pinned_messages: count
                });
                
                if (success) {
                    await interaction.reply({
                        content: `✅ **Maximum Pinned Messages Updated**\n\nNew limit: ${count} messages\n\nThe bot will now keep the last ${count} spotlight messages pinned in the #weekly-spotlight channel.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Failed to update spotlight configuration.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error setting max pinned messages:', error);
                await interaction.reply({
                    content: '❌ An error occurred while updating the configuration.',
                    ephemeral: true
                });
            }
        }
        
        if (subcommand === 'view') {
            try {
                const data = spotlightManager.loadSpotlightData();
                if (!data) {
                    await interaction.reply({
                        content: '❌ Could not load spotlight configuration.',
                        ephemeral: true
                    });
                    return;
                }
                
                const configMessage = [
                    '⚙️ **Current Spotlight Configuration**\n',
                    `🔗 **n8n Integration:** ${data.settings.enable_n8n_integration ? '✅ Enabled' : '❌ Disabled'}`,
                    data.settings.enable_n8n_integration ? `   URL: ${data.settings.n8n_webhook_url || 'Not set'}` : '',
                    '',
                    `📊 **Google Sheets Integration:** ${data.settings.enable_gsheets_integration ? '✅ Enabled' : '❌ Disabled'}`,
                    data.settings.enable_gsheets_integration ? `   URL: ${data.settings.gsheets_url || 'Not set'}` : '',
                    '',
                    `📌 **Max Pinned Messages:** ${data.settings.max_pinned_messages || 4}`,
                    `📚 **Local Spotlights Available:** ${data.spotlights?.length || 0}`,
                    '',
                    '💡 **Data Priority:**',
                    '1. n8n webhook (if enabled)',
                    '2. Google Sheets (if enabled)',
                    '3. Local spotlight data',
                    '4. Fallback message'
                ].filter(line => line !== '');
                
                await interaction.reply({
                    content: configMessage.join('\n'),
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error viewing spotlight configuration:', error);
                await interaction.reply({
                    content: '❌ An error occurred while loading the configuration.',
                    ephemeral: true
                });
            }
        }
    }
    
    // Handle spotlight-control command
    if (interaction.commandName === 'spotlight-control') {
        // Check if the user has administrator permission
        if (!interaction.member.permissions.has('Administrator')) {
            await interaction.reply({
                content: '❌ You need Administrator permission to control spotlight automation.',
                ephemeral: true
            });
            return;
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'start') {
            try {
                spotlightManager.start();
                await interaction.reply({
                    content: '✅ **Weekly Spotlight Automation Started**\n\nThe automation is now running and will post spotlights every Monday at 00:00 UTC.',
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error starting spotlight automation:', error);
                await interaction.reply({
                    content: '❌ An error occurred while starting the spotlight automation.',
                    ephemeral: true
                });
            }
        }
        
        if (subcommand === 'stop') {
            try {
                spotlightManager.stop();
                await interaction.reply({
                    content: '⏹️ **Weekly Spotlight Automation Stopped**\n\nThe automation has been stopped and will no longer post automated spotlights.',
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error stopping spotlight automation:', error);
                await interaction.reply({
                    content: '❌ An error occurred while stopping the spotlight automation.',
                    ephemeral: true
                });
            }
        }
        
        if (subcommand === 'restart') {
            try {
                spotlightManager.stop();
                spotlightManager.start();
                await interaction.reply({
                    content: '🔄 **Weekly Spotlight Automation Restarted**\n\nThe automation has been restarted and will resume posting spotlights every Monday at 00:00 UTC.',
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error restarting spotlight automation:', error);
                await interaction.reply({
                    content: '❌ An error occurred while restarting the spotlight automation.',
                    ephemeral: true
                });
            }
        }
    }
    
    // Handle onboard command
    if (interaction.commandName === 'onboard') {
        const userType = interaction.options.getString('user-type');
        const interests = interaction.options.getString('interests');
        const experience = interaction.options.getString('experience');
        const goals = interaction.options.getString('goals');
        
        // Debug logging
        console.log('Onboarding command received:');
        console.log('- userType:', userType);
        console.log('- interests:', interests);
        console.log('- experience:', experience);
        console.log('- goals:', goals);
        
        // Validate user type
        const validUserTypes = ['freelancer', 'client', 'learner', 'agency'];
        if (!validUserTypes.includes(userType)) {
            await interaction.reply({
                content: `❌ **Invalid user type: "${userType}"**\n\n` +
                        `Please select one of the following options from the dropdown:\n` +
                        `• 🛠️ **Freelancer** - I offer automation services\n` +
                        `• 📦 **Client** - I need automation solutions\n` +
                        `• 🎓 **Learning** - I'm learning automation\n` +
                        `• 🏢 **Agency** - I run an automation agency\n\n` +
                        `**Tip:** Use the dropdown menu, don't type custom values!`,
                ephemeral: true
            });
            return;
        }
        
        // Build responses object
        const responses = {
            user_type: userType
        };
        
        if (interests) {
            responses.interests = interests.split(',').map(i => i.trim().toLowerCase());
        }
        
        if (experience) {
            responses.experience = experience;
        }
        
        if (goals) {
            responses.goals = goals.split(',').map(g => g.trim().toLowerCase());
        }
        
        await interaction.reply({
            content: '🔄 Processing your onboarding responses...',
            ephemeral: true
        });
        
        try {
            const result = await onboardingManager.completeOnboarding(interaction.member, responses);
            
            if (result.success) {
                await interaction.followUp({
                    content: `✅ **Onboarding Complete!**\n\n` +
                            `**Assigned Roles:** ${result.roles.join(', ') || 'Community Member'}\n` +
                            `**Recommended Channels:** ${result.channels.length} channels selected\n\n` +
                            `Check your DMs for a personalized welcome message and explore your recommended channels!`,
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: `❌ **Onboarding Failed**\n\n${result.error}`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error during manual onboarding:', error);
            await interaction.followUp({
                content: '❌ An error occurred during onboarding. Please try again later.',
                ephemeral: true
            });
        }
    }
    
    // Handle onboarding-status command
    if (interaction.commandName === 'onboarding-status') {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        // Check if user is requesting another user's status and has permission
        if (targetUser.id !== interaction.user.id && !interaction.member.permissions.has('Administrator')) {
            await interaction.reply({
                content: '❌ You need Administrator permission to check other users\' onboarding status.',
                ephemeral: true
            });
            return;
        }
        
        try {
            const status = onboardingManager.getUserStatus(targetUser.id);
            
            if (!status) {
                await interaction.reply({
                    content: `📋 **Onboarding Status for ${targetUser.tag}**\n\n❌ No onboarding data found.\n\nUse \`/onboard\` to complete the onboarding process.`,
                    ephemeral: true
                });
                return;
            }
            
            const statusMessage = [
                `📋 **Onboarding Status for ${targetUser.tag}**\n`,
                `✅ **Completed:** ${status.onboarding_completed ? 'Yes' : 'No'}`,
                `📅 **Joined:** <t:${Math.floor(new Date(status.joined_at).getTime() / 1000)}:F>`,
            ];
            
            if (status.onboarding_completed) {
                statusMessage.push(`📅 **Completed:** <t:${Math.floor(new Date(status.completed_at).getTime() / 1000)}:F>`);
                statusMessage.push(`🎭 **Assigned Roles:** ${status.assigned_roles.join(', ') || 'None'}`);
                statusMessage.push(`📺 **Recommended Channels:** ${status.recommended_channels.length}`);
                
                if (status.recommended_channels.length > 0) {
                    statusMessage.push('');
                    statusMessage.push('**📺 Channel Recommendations:**');
                    status.recommended_channels.slice(0, 10).forEach(channel => {
                        statusMessage.push(`• #${channel}`);
                    });
                }
            } else {
                statusMessage.push('');
                statusMessage.push('💡 Use `/onboard` to complete the onboarding process.');
            }
            
            await interaction.reply({
                content: statusMessage.join('\n'),
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error getting onboarding status:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching onboarding status.',
                ephemeral: true
            });
        }
    }
    
    // Handle onboarding-stats command
    if (interaction.commandName === 'onboarding-stats') {
        // Check if user has administrator permission
        if (!interaction.member.permissions.has('Administrator')) {
            await interaction.reply({
                content: '❌ You need Administrator permission to view onboarding statistics.',
                ephemeral: true
            });
            return;
        }
        
        try {
            const stats = onboardingManager.getOnboardingStats(interaction.guild.id);
            
            const statsMessage = [
                '📊 **Server Onboarding Statistics**\n',
                `👥 **Total Users:** ${stats.total_users}`,
                `✅ **Completed Onboarding:** ${stats.completed_onboarding}`,
                `📈 **Completion Rate:** ${stats.completion_rate}%`,
                ''
            ];
            
            if (Object.keys(stats.role_distribution).length > 0) {
                statsMessage.push('**🎭 Role Distribution:**');
                Object.entries(stats.role_distribution).forEach(([role, count]) => {
                    statsMessage.push(`• ${role}: ${count} users`);
                });
                statsMessage.push('');
            }
            
            if (stats.popular_channels.length > 0) {
                statsMessage.push('**📺 Most Popular Channels:**');
                stats.popular_channels.forEach(({ channel, count }) => {
                    statsMessage.push(`• #${channel}: ${count} recommendations`);
                });
            }
            
            await interaction.reply({
                content: statsMessage.join('\n'),
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error getting onboarding stats:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching onboarding statistics.',
                ephemeral: true
            });
        }
    }
    
    // Handle re-onboard command
    if (interaction.commandName === 're-onboard') {
        await interaction.reply({
            content: '🔄 **Re-onboarding Process**\n\n' +
                     'To update your preferences and channel recommendations:\n\n' +
                     '1. Use `/onboard` command with your updated preferences\n' +
                     '2. Your previous settings will be overridden\n' +
                     '3. New roles and channel access will be assigned\n\n' +
                     '💡 **Tip:** You can run `/onboard` multiple times to refine your experience!',
            ephemeral: true
        });
    }
    
    // Handle test-welcome command
    if (interaction.commandName === 'test-welcome') {
        // Check if user has administrator permission
        if (!interaction.member.permissions.has('Administrator')) {
            await interaction.reply({
                content: '❌ You need Administrator permission to test the welcome system.',
                ephemeral: true
            });
            return;
        }
        
        const targetUser = interaction.options.getUser('user');
        
        await interaction.reply({
            content: `🔄 Sending test welcome message to ${targetUser.tag}...`,
            ephemeral: true
        });
        
        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            await onboardingManager.handleNewMember(member);
            
            await interaction.followUp({
                content: `✅ Test welcome message sent to ${targetUser.tag}!\n\nCheck their DMs for the welcome message.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error sending test welcome:', error);
            await interaction.followUp({
                content: '❌ An error occurred while sending the test welcome message.',
                ephemeral: true
            });
        }
    }
    
    // Handle test-interactive command
    if (interaction.commandName === 'test-interactive') {
        // Check if user has administrator permission
        if (!interaction.member.permissions.has('Administrator')) {
            await interaction.reply({
                content: '❌ You need Administrator permission to test the interactive onboarding.',
                ephemeral: true
            });
            return;
        }
        
        try {
            await onboardingManager.handleStartOnboarding(interaction);
        } catch (error) {
            console.error('Error starting test interactive onboarding:', error);
            await interaction.reply({
                content: '❌ An error occurred while starting the interactive onboarding test.',
                ephemeral: true
            });
        }
    }
    
    // Handle create-welcome-interactive command
    if (interaction.commandName === 'create-welcome-interactive') {
        // Check if user has administrator permission
        if (!interaction.member.permissions.has('Administrator')) {
            await interaction.reply({
                content: '❌ You need Administrator permission to create interactive welcome messages.',
                ephemeral: true
            });
            return;
        }
        
        await interaction.reply({
            content: '🔄 Creating interactive welcome message in #start-here...',
            ephemeral: true
        });
        
        try {
            await onboardingManager.createWelcomeInteractiveMessage(interaction.guild);
            
            await interaction.followUp({
                content: '✅ **Interactive Welcome Message Created!**\n\nCheck the #start-here channel for the new interactive welcome message with buttons!',
                ephemeral: true
            });
        } catch (error) {
            console.error('Error creating interactive welcome message:', error);
            await interaction.followUp({
                content: '❌ An error occurred while creating the interactive welcome message.',
                ephemeral: true
            });
        }
    }
    
    // Handle new interactive commands
    if (interaction.commandName === 'money') {
        await interactiveHandler.handleMoneyCommand(interaction);
        return;
    }
    
    if (interaction.commandName === 'profile') {
        await interactiveHandler.handleProfileCommand(interaction);
        return;
    }
    
    if (interaction.commandName === 'leaderboard') {
        await interactiveHandler.handleLeaderboardCommand(interaction);
        return;
    }
    
    // Handle other interactive commands with placeholder responses
    if (interaction.commandName === 'reaction-roles') {
        await interaction.reply({
            content: '🎯 **Reaction Roles System**\n\n' +
                    'This feature allows you to create interactive role assignment messages.\n\n' +
                    '⚠️ **Coming Soon:** Full reaction role automation with custom emojis and role mappings.\n\n' +
                    'For now, use `/assign-role` for manual role management.',
            ephemeral: true
        });
        return;
    }
    
    if (interaction.commandName === 'poll') {
        const question = interaction.options.getString('question');
        const optionsString = interaction.options.getString('options');
        const duration = interaction.options.getInteger('duration') || 24;
        const anonymous = interaction.options.getBoolean('anonymous') || false;
        
        const options = optionsString.split(',').map(opt => opt.trim()).slice(0, 10);
        
        if (options.length < 2) {
            await interaction.reply({
                content: '❌ **Invalid Poll Options**\n\nPlease provide at least 2 options separated by commas.\n\nExample: `Yes, No, Maybe`',
                ephemeral: true
            });
            return;
        }
        
        const { EmbedBuilder } = require('discord.js');
        
        const pollEmbed = new EmbedBuilder()
            .setTitle(`📊 ${question}`)
            .setColor('#7289da')
            .setDescription(options.map((opt, index) => `${index + 1}️⃣ ${opt}`).join('\n'))
            .addFields([
                { name: '⏰ Duration', value: `${duration} hours`, inline: true },
                { name: '🔒 Anonymous', value: anonymous ? 'Yes' : 'No', inline: true },
                { name: '👤 Created by', value: interaction.user.tag, inline: true }
            ])
            .setFooter({ text: 'React with numbers to vote!' })
            .setTimestamp();
        
        const pollMessage = await interaction.reply({ embeds: [pollEmbed], fetchReply: true });
        
        // Add reaction emojis
        const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        for (let i = 0; i < Math.min(options.length, numberEmojis.length); i++) {
            await pollMessage.react(numberEmojis[i]);
        }
        
        return;
    }
    
    if (interaction.commandName === 'skill-assessment') {
        const category = interaction.options.getString('category');
        
        await interaction.reply({
            content: `🧠 **n8n Skill Assessment - ${category.toUpperCase()}**\n\n` +
                    `Ready to test your knowledge in ${category}?\n\n` +
                    '⚠️ **Coming Soon:** Interactive skill assessments with:\n' +
                    '• Multiple choice questions\n' +
                    '• Practical scenario challenges\n' +
                    '• Automatic role assignment based on scores\n' +
                    '• Skill level badges and recognition\n\n' +
                    'For now, share your experience in the relevant channels!',
            ephemeral: true
        });
        return;
    }
    
    if (interaction.commandName === 'auto-mod') {
        // Check if user has administrator permission
        if (!interaction.member.permissions.has('Administrator')) {
            await interaction.reply({
                content: '❌ You need Administrator permission to configure auto-moderation.',
                ephemeral: true
            });
            return;
        }
        
        await interaction.reply({
            content: '🛡️ **Auto-Moderation Configuration**\n\n' +
                    '⚠️ **Coming Soon:** Advanced auto-moderation features including:\n\n' +
                    '• Spam detection and filtering\n' +
                    '• Suspicious link blocking\n' +
                    '• Excessive caps filtering\n' +
                    '• Custom keyword filters\n' +
                    '• Automatic warnings and timeouts\n\n' +
                    'Discord\'s built-in AutoMod is recommended for now.',
            ephemeral: true
        });
        return;
    }
    
    if (interaction.commandName === 'help') {
        const category = interaction.options.getString('category');
        
        const helpContent = {
            'getting-started': {
                title: '🚀 Getting Started Guide',
                content: [
                    '**Welcome to the n8n Automation Community!**\n',
                    '📋 **First Steps:**',
                    '• Complete `/onboard` for personalized experience',
                    '• Introduce yourself in #introductions',
                    '• Explore channels matching your role\n',
                    '🔧 **Basic Commands:**',
                    '• `/profile view` - See your community profile',
                    '• `/leaderboard` - View community rankings',
                    '• `/money dashboard` - Track your earnings (freelancers)\n',
                    '💡 **Need help?** Ask in #general-chat or use `/help` with other categories!'
                ]
            },
            'finding-work': {
                title: '💼 Finding Work Guide',
                content: [
                    '**Ready to find automation projects?**\n',
                    '📋 **Job Channels:**',
                    '• #post-a-job - Browse client project postings',
                    '• #available-for-hire - Showcase your skills',
                    '• #project-portfolio - View completed work examples\n',
                    '🎯 **Pro Tips:**',
                    '• Complete your `/profile` with showcases',
                    '• Track earnings with `/money` commands',
                    '• Engage in technical discussions to build reputation\n',
                    '🏆 **Stand Out:** Get "Verified Pro" status by demonstrating expertise!'
                ]
            },
            'hiring': {
                title: '👥 Hiring Talent Guide',
                content: [
                    '**Looking to hire automation experts?**\n',
                    '📋 **Hiring Process:**',
                    '• Post in #post-a-job with clear requirements',
                    '• Browse #available-for-hire for talent',
                    '• Use `/interview start @candidate` for private discussions\n',
                    '🎯 **Best Practices:**',
                    '• Be specific about project scope and budget',
                    '• Check portfolios in #project-portfolio',
                    '• Look for active community contributors\n',
                    '💡 **Tip:** Verified Pros have demonstrated expertise!'
                ]
            },
            'technical': {
                title: '🔧 Technical Help',
                content: [
                    '**Need technical assistance?**\n',
                    '📋 **Help Channels:**',
                    '• #integration-issues - API and connection problems',
                    '• #advanced-expressions - Complex logic and coding',
                    '• #general-chat - Quick questions and discussions\n',
                    '🎯 **When Asking for Help:**',
                    '• Describe your workflow goal clearly',
                    '• Share error messages or screenshots',
                    '• Mention what you\'ve already tried\n',
                    '⭐ **Pro Tip:** Use forum channels with tags for better organization!'
                ]
            },
            'forums': {
                title: '🎯 Forum Features',
                content: [
                    '**Make the most of our forum channels!**\n',
                    '📋 **Forum Benefits:**',
                    '• Organized discussions with tags',
                    '• Mark solutions for future reference',
                    '• Level-based filtering (Beginner → Expert)\n',
                    '🏷️ **Available Tags:**',
                    '• Skill Level: Beginner, Intermediate, Advanced, Expert',
                    '• Topics: API, Data, AI/ML, E-commerce, Marketing\n',
                    '✅ **Mark Solutions:** Help others by marking helpful replies as solutions!'
                ]
            },
            'advanced': {
                title: '⭐ Advanced Features',
                content: [
                    '**Unlock advanced community features!**\n',
                    '💰 **Financial Tracking:**',
                    '• `/money dashboard` - View earnings overview',
                    '• `/money update` - Log revenue and projects',
                    '• `/money leaderboard` - See top earners\n',
                    '🏆 **Community Recognition:**',
                    '• `/leaderboard` - Community contribution rankings',
                    '• `/profile showcase` - Add portfolio highlights',
                    '• Earn "Verified Pro" status through expertise\n',
                    '🔧 **Pro Tools:** More advanced features coming soon!'
                ]
            }
        };
        
        if (category && helpContent[category]) {
            const help = helpContent[category];
            await interaction.reply({
                content: `${help.title}\n\n${help.content.join('\n')}`,
                ephemeral: true
            });
        } else {
            // Show all categories
            await interaction.reply({
                content: '📚 **Interactive Help System**\n\n' +
                        'Choose a category for detailed help:\n\n' +
                        '🚀 `/help getting-started` - New user guide\n' +
                        '💼 `/help finding-work` - Freelancer resources\n' +
                        '👥 `/help hiring` - Client hiring guide\n' +
                        '🔧 `/help technical` - Technical assistance\n' +
                        '🎯 `/help forums` - Forum channel usage\n' +
                        '⭐ `/help advanced` - Advanced features\n\n' +
                        '💡 **Quick Help:** Use `/onboard` to personalize your experience!',
                ephemeral: true
            });
        }
        return;
    }
    
    // Handle Vegas-style commands for maximum fun!
    if (interaction.commandName === 'faq') {
        await vegasHandler.handleFaqCommand(interaction);
        return;
    }
    
    if (interaction.commandName === 'signboard') {
        await vegasHandler.handleSignboardCommand(interaction);
        return;
    }
    
    if (interaction.commandName === 'showcase') {
        const demo = interaction.options.getString('demo') || 'full-tour';
        
        await interaction.reply({
            content: `🎪 **${demo.toUpperCase()} DEMO** 🎪\n\n` +
                    '🎰 **Welcome to the n8n Vegas Convention Center showcase!**\n\n' +
                    (demo === 'money-demo' ? 
                        '💰 **Money Dashboard Features:**\n• Track your automation empire\n• Climb financial leaderboards\n• Set and achieve goals\n• Private or public sharing\n\n🎯 **Try it now:** `/money dashboard`' :
                    demo === 'leaderboard-demo' ?
                        '🏆 **Leaderboard Features:**\n• Community contributions\n• Financial achievements\n• Rising star recognition\n• Monthly competitions\n\n🎯 **Try it now:** `/leaderboard`' :
                    demo === 'profile-demo' ?
                        '👤 **Profile Features:**\n• Professional showcase\n• Project portfolios\n• Community statistics\n• Achievement tracking\n\n🎯 **Try it now:** `/profile view`' :
                        '🎪 **Full Feature Tour:**\n• `/money` - Financial tracking empire\n• `/leaderboard` - Community fame\n• `/profile` - Professional showcase\n• `/faq` - Complete help system\n• `/slots` - Casino fun\n• `/8ball` - Automation oracle\n• `/tip` - Random wisdom\n• `/celebrate` - Vegas parties!') +
                    '\n\n✨ **This is just the beginning!** Explore all commands for hidden surprises!',
            ephemeral: true
        });
        return;
    }
    
    if (interaction.commandName === 'tip') {
        await vegasHandler.handleTipCommand(interaction);
        return;
    }
    
    if (interaction.commandName === 'slots') {
        await vegasHandler.handleSlotsCommand(interaction);
        return;
    }
    
    if (interaction.commandName === '8ball') {
        await vegasHandler.handleEightBallCommand(interaction);
        return;
    }
    
    if (interaction.commandName === 'celebrate') {
        await vegasHandler.handleCelebrateCommand(interaction);
        return;
    }
    
    if (interaction.commandName === 'mood') {
        await vegasHandler.handleMoodCommand(interaction);
        return;
    }
    
    // Handle gamification commands
    if (interaction.commandName === 'progress') {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const embed = gamificationManager.createProgressEmbed(targetUser.id);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    
    if (interaction.commandName === 'leaderboard') {
        const type = interaction.options.getString('type') || 'helpfulness';
        const embed = gamificationManager.createLeaderboardEmbed(type, interaction.guild);
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    if (interaction.commandName === 'levels') {
        const category = interaction.options.getString('category') || 'helpfulness';
        // Create levels embed - placeholder for now
        await interaction.reply({
            content: `📊 **${category.toUpperCase()} LEVELS**\n\n` +
                    '🏅 **Coming Soon:** Detailed level information with:\n' +
                    '• Level requirements and rewards\n' +
                    '• Progress tracking and goals\n' +
                    '• Feature unlock previews\n\n' +
                    'Use `/progress` to see your current level!',
            ephemeral: true
        });
        return;
    }
    
    if (interaction.commandName === 'badges') {
        const category = interaction.options.getString('category') || 'achievement';
        // Create badges embed - placeholder for now
        await interaction.reply({
            content: `🏆 **${category.toUpperCase()} BADGES**\n\n` +
                    '🎖️ **Coming Soon:** Badge showcase with:\n' +
                    '• All available badges and requirements\n' +
                    '• Your earned badges and progress\n' +
                    '• Badge unlock conditions\n\n' +
                    'Use `/progress` to see your earned badges!',
            ephemeral: true
        });
        return;
    }
    
    if (interaction.commandName === 'discover') {
        // Feature discovery based on user level - placeholder for now
        await interaction.reply({
            content: '🔍 **Feature Discovery**\n\n' +
                    '✨ **Available Features:** Based on your contribution level, you have access to:\n\n' +
                    '• Community polls and networking\n' +
                    '• Progress tracking and achievements\n' +
                    '• Interactive help system\n\n' +
                    '🎯 **Level Up to Unlock More:** Help others and track your success to unlock advanced features!\n\n' +
                    'Use `/progress` to see your current level and next rewards!',
            ephemeral: true
        });
        return;
    }
    
    if (interaction.commandName === 'award-points') {
        // Check if user has admin permissions
        if (!interaction.member.permissions.has('Administrator')) {
            await interaction.reply({ 
                content: '❌ You need administrator permissions to award points.', 
                ephemeral: true 
            });
            return;
        }
        
        const targetUser = interaction.options.getUser('user');
        const points = interaction.options.getInteger('points');
        const reason = interaction.options.getString('reason') || 'Manual award by admin';
        
        const result = await gamificationManager.addHelpfulnessPoints(targetUser.id, points, reason);
        
        await interaction.reply({
            content: `✅ Awarded ${points} points to <@${targetUser.id}> for: ${reason}\n\n` +
                    (result.leveledUp ? `🎉 **Level Up!** ${targetUser.tag} reached level ${result.newLevel}!` : 
                     `Current points: ${result.totalPoints}`),
            ephemeral: true
        });
        
        // Send notifications
        const notifications = gamificationManager.getAndClearPendingNotifications();
        await sendGamificationNotifications(notifications, interaction.guild);
        return;
    }
    
    if (interaction.commandName === 'activity') {
        const channel = interaction.options.getChannel('channel');
        const timeframe = interaction.options.getString('timeframe') || '7d';
        
        const targetChannel = channel || interaction.channel;
        
        await interaction.reply({
            content: `📊 **Channel Activity Analysis**\n\n` +
                    `**Channel:** ${targetChannel}\n` +
                    `**Timeframe:** ${timeframe}\n\n` +
                    '⚠️ **Coming Soon:** Detailed activity analytics including:\n\n' +
                    '• Message count and trends\n' +
                    '• Active user statistics\n' +
                    '• Peak activity times\n' +
                    '• Popular topics and keywords\n\n' +
                    'Use Discord\'s built-in Server Insights for now.',
            ephemeral: true
        });
        return;
    }
});

// Add missing privacy setting handler for money command
interactiveHandler.updatePrivacySettings = async function(interaction) {
    const showRevenue = interaction.options.getBoolean('show-revenue');
    const showProjects = interaction.options.getBoolean('show-projects');
    const showRate = interaction.options.getBoolean('show-rate');
    const anonymousOnly = interaction.options.getBoolean('anonymous-only');
    
    const userId = interaction.user.id;
    const userData = await this.getUserFinancialData(userId);
    
    userData.privacy = userData.privacy || {};
    if (showRevenue !== null) userData.privacy.showRevenue = showRevenue;
    if (showProjects !== null) userData.privacy.showProjects = showProjects;
    if (showRate !== null) userData.privacy.showRate = showRate;
    if (anonymousOnly !== null) userData.privacy.anonymousOnly = anonymousOnly;
    
    await this.saveUserFinancialData(userId, userData);
    
    await interaction.reply({
        content: '✅ **Privacy Settings Updated!**\n\n' +
                `🔒 **Current Settings:**\n` +
                `• Show Revenue: ${userData.privacy.showRevenue ? '✅' : '❌'}\n` +
                `• Show Projects: ${userData.privacy.showProjects ? '✅' : '❌'}\n` +
                `• Show Rate: ${userData.privacy.showRate ? '✅' : '❌'}\n` +
                `• Anonymous Only: ${userData.privacy.anonymousOnly ? '✅' : '❌'}\n\n` +
                'Your privacy preferences have been saved and will be respected in all leaderboards.',
        ephemeral: true
    });
};

// Add missing community stats handler
interactiveHandler.showCommunityStats = async function(interaction) {
    const allUsers = await this.getAllFinancialData();
    
    const stats = {
        totalUsers: Object.keys(allUsers).length,
        totalRevenue: 0,
        totalProjects: 0,
        avgMonthlyRevenue: 0,
        avgHourlyRate: 0
    };
    
    const rates = [];
    const revenues = [];
    
    Object.values(allUsers).forEach(user => {
        if (user.totalRevenue) {
            stats.totalRevenue += user.totalRevenue;
            revenues.push(user.totalRevenue);
        }
        if (user.totalProjects) stats.totalProjects += user.totalProjects;
        if (user.hourlyRate) rates.push(user.hourlyRate);
        if (user.monthlyRevenue) revenues.push(user.monthlyRevenue);
    });
    
    if (revenues.length > 0) {
        stats.avgMonthlyRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    }
    
    if (rates.length > 0) {
        stats.avgHourlyRate = rates.reduce((a, b) => a + b, 0) / rates.length;
    }
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Community Financial Statistics')
        .setColor('#00ff00')
        .addFields([
            {
                name: '👥 Community Overview',
                value: `**Active Users:** ${stats.totalUsers}\n**Total Projects:** ${stats.totalProjects}\n**Combined Revenue:** $${stats.totalRevenue.toLocaleString()}`,
                inline: true
            },
            {
                name: '💰 Averages',
                value: `**Avg Monthly:** $${Math.round(stats.avgMonthlyRevenue).toLocaleString()}\n**Avg Hourly Rate:** $${Math.round(stats.avgHourlyRate)}/hr`,
                inline: true
            },
            {
                name: '📈 Growth',
                value: 'Community growing strong!\nMore stats coming soon...',
                inline: true
            }
        ])
        .setFooter({ text: 'Data is anonymized and aggregated • Privacy settings respected' })
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
};

// Helper function to send gamification notifications
async function sendGamificationNotifications(notifications, guild) {
    try {
        // Send level up notifications
        for (const levelUp of notifications.levelUps) {
            const member = await guild.members.fetch(levelUp.userId);
            if (member) {
                // Send to a celebration channel or DM
                const celebrationChannel = guild.channels.cache.find(ch => ch.name === 'announcements') || 
                                         guild.channels.cache.find(ch => ch.type === 0); // Text channel
                
                if (celebrationChannel) {
                    await celebrationChannel.send({
                        content: `🎉 Congratulations <@${levelUp.userId}>!`,
                        embeds: [levelUp.embed]
                    });
                }
            }
        }
        
        // Send badge notifications
        for (const badge of notifications.badges) {
            const member = await guild.members.fetch(badge.userId);
            if (member) {
                try {
                    await member.send({
                        content: `🏆 You've earned a new badge!`,
                        embeds: [badge.embed]
                    });
                } catch (error) {
                    // If DM fails, send to channel
                    const badgeChannel = guild.channels.cache.find(ch => ch.name === 'announcements');
                    if (badgeChannel) {
                        await badgeChannel.send({
                            content: `🏆 <@${badge.userId}> earned a new badge!`,
                            embeds: [badge.embed]
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error sending gamification notifications:', error);
    }
}

// Helper function to update spotlight configuration
function updateSpotlightConfig(updates) {
    try {
        const dataFile = path.join(__dirname, 'data/spotlight.json');
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        
        // Update the settings
        Object.assign(data.settings, updates);
        
        // Write back to file
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        console.log('Spotlight configuration updated:', updates);
        return true;
    } catch (error) {
        console.error('Error updating spotlight configuration:', error);
        return false;
    }
}

// Helper function to calculate next Monday
function getNextMonday() {
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay() + 1) % 7);
    nextMonday.setUTCHours(0, 0, 0, 0);
    return nextMonday;
}

client.on('error', error => {
    console.error('Discord client error:', error);
});

// Health check endpoint for Render.com
const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            bot: client.user ? client.user.tag : 'connecting',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Health check server running on port ${PORT}`);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to login to Discord:', error);
    process.exit(1);
});
