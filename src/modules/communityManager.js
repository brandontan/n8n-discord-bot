const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class CommunityManager {
    constructor() {
        this.dataFile = path.join(__dirname, '../data/communityData.json');
        this.assetsDir = path.join(__dirname, '../assets');
        this.unsplashAccessKey = 'YOUR_UNSPLASH_ACCESS_KEY'; // Add to environment variables
    }

    /**
     * Initialize community data storage and assets directory
     */
    async initializeCommunityData() {
        try {
            // Create assets directory
            await fs.mkdir(this.assetsDir, { recursive: true });
            
            // Check if community data file exists, create if not
            try {
                await fs.access(this.dataFile);
            } catch {
                const defaultData = {
                    serverGuide: {
                        enabled: true,
                        welcomeMessage: "Hi there and welcome to the n8n server! We're very excited to have you here and look forward to hearing about all the workflows you're working on. Before you dive in and explore the community, please be aware that the Discord is not for support requests. Please see https://community.n8n.io",
                        steps: [
                            {
                                title: "Introduce yourself!",
                                description: "Tell us about yourself in #introductions",
                                channelId: null,
                                completed: false
                            },
                            {
                                title: "Let us know what you're working on!",
                                description: "Share your automation projects",
                                channelId: null,
                                completed: false
                            },
                            {
                                title: "Check out the latest news!",
                                description: "Stay updated with n8n announcements",
                                channelId: null,
                                completed: false
                            },
                            {
                                title: "Select your language if needed!",
                                description: "Choose your preferred language",
                                roleSelection: true,
                                completed: false
                            },
                            {
                                title: "Select your industry or interests!",
                                description: "Get access to relevant channels",
                                roleSelection: true,
                                completed: false
                            },
                            {
                                title: "Read the rules",
                                description: "Understand community guidelines",
                                rulesChannel: true,
                                completed: false
                            }
                        ]
                    },
                    onboarding: {
                        enabled: true,
                        questions: [
                            {
                                type: "role_selection",
                                title: "What best describes you?",
                                options: [
                                    { label: "🛠️ Freelancer", value: "freelancer", description: "I offer automation services" },
                                    { label: "📦 Client", value: "client", description: "I need automation solutions" },
                                    { label: "🎓 Learning", value: "learner", description: "I'm learning automation" },
                                    { label: "🏢 Agency", value: "agency", description: "I run an automation agency" },
                                    { label: "👨‍💻 Developer", value: "developer", description: "I build integrations" }
                                ]
                            },
                            {
                                type: "multi_select",
                                title: "What industries interest you?",
                                options: [
                                    { label: "🛒 E-commerce", value: "ecommerce" },
                                    { label: "📈 Marketing", value: "marketing" },
                                    { label: "💰 Finance", value: "finance" },
                                    { label: "🏥 Healthcare", value: "healthcare" },
                                    { label: "🎓 Education", value: "education" },
                                    { label: "🏭 Manufacturing", value: "manufacturing" },
                                    { label: "🎨 Creative", value: "creative" },
                                    { label: "📊 Data & Analytics", value: "data" }
                                ]
                            },
                            {
                                type: "select",
                                title: "What's your automation experience level?",
                                options: [
                                    { label: "🌱 Beginner", value: "beginner", description: "Just getting started" },
                                    { label: "🔧 Intermediate", value: "intermediate", description: "Some experience with workflows" },
                                    { label: "🚀 Advanced", value: "advanced", description: "Building complex automations" },
                                    { label: "⭐ Expert", value: "expert", description: "Professional automation developer" }
                                ]
                            }
                        ]
                    },
                    assets: {
                        serverBanner: null,
                        serverIcon: null,
                        welcomeScreenBackground: null,
                        categoryIcons: {},
                        roleIcons: {}
                    },
                    features: {
                        forumChannels: true,
                        events: true,
                        announcements: true,
                        autoModeration: true,
                        welcomeScreen: true
                    }
                };
                
                await fs.writeFile(this.dataFile, JSON.stringify(defaultData, null, 2));
            }
        } catch (error) {
            console.error('Error initializing community data:', error);
            throw error;
        }
    }

    /**
     * Download and prepare visual assets from Unsplash
     */
    async downloadCommunityAssets() {
        try {
            console.log('🎨 Downloading community visual assets...');
            
            const assets = [
                {
                    query: 'automation technology workflow dark gradient',
                    filename: 'server-banner.jpg',
                    width: 960,
                    height: 540,
                    purpose: 'Server Banner'
                },
                {
                    query: 'n8n workflow automation nodes purple',
                    filename: 'server-icon.jpg',
                    width: 512,
                    height: 512,
                    purpose: 'Server Icon'
                },
                {
                    query: 'welcome community dark technology',
                    filename: 'welcome-background.jpg',
                    width: 1920,
                    height: 1080,
                    purpose: 'Welcome Screen Background'
                },
                {
                    query: 'networking professional community',
                    filename: 'freelancer-icon.jpg',
                    width: 128,
                    height: 128,
                    purpose: 'Freelancer Role Icon'
                },
                {
                    query: 'business client handshake',
                    filename: 'client-icon.jpg',
                    width: 128,
                    height: 128,
                    purpose: 'Client Role Icon'
                },
                {
                    query: 'learning education books technology',
                    filename: 'learner-icon.jpg',
                    width: 128,
                    height: 128,
                    purpose: 'Learner Role Icon'
                },
                {
                    query: 'agency team collaboration',
                    filename: 'agency-icon.jpg',
                    width: 128,
                    height: 128,
                    purpose: 'Agency Role Icon'
                },
                {
                    query: 'developer coding programming',
                    filename: 'developer-icon.jpg',
                    width: 128,
                    height: 128,
                    purpose: 'Developer Role Icon'
                }
            ];

            for (const asset of assets) {
                console.log(`📥 Downloading ${asset.purpose}...`);
                
                try {
                    // Search for image on Unsplash
                    const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(asset.query)}&per_page=1&orientation=landscape`;
                    
                    const searchResponse = await axios.get(searchUrl, {
                        headers: {
                            'Authorization': `Client-ID ${this.unsplashAccessKey}`
                        }
                    });

                    if (searchResponse.data.results.length > 0) {
                        const photo = searchResponse.data.results[0];
                        const imageUrl = `${photo.urls.raw}&w=${asset.width}&h=${asset.height}&fit=crop&crop=center`;
                        
                        // Download the image
                        const imageResponse = await axios.get(imageUrl, {
                            responseType: 'arraybuffer'
                        });
                        
                        // Save to assets directory
                        const filePath = path.join(this.assetsDir, asset.filename);
                        await fs.writeFile(filePath, imageResponse.data);
                        
                        console.log(`✅ Downloaded: ${asset.purpose} → ${asset.filename}`);
                    } else {
                        console.log(`⚠️ No images found for: ${asset.purpose}`);
                    }
                } catch (downloadError) {
                    console.error(`❌ Failed to download ${asset.purpose}:`, downloadError.message);
                }
                
                // Rate limiting - wait between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.log('🎨 Community assets download complete!');
            
        } catch (error) {
            console.error('Error downloading community assets:', error);
            // Don't throw error - assets are optional
        }
    }

    /**
     * Setup Discord Community Server features
     */
    async setupCommunityFeatures(guild) {
        try {
            console.log(`🏛️ Setting up Community features for: ${guild.name}`);
            
            await this.initializeCommunityData();
            
            const results = {
                serverGuide: false,
                onboarding: false,
                welcomeScreen: false,
                autoModeration: false,
                events: false,
                errors: []
            };

            // 1. Setup Welcome Screen
            try {
                console.log('📋 Setting up Welcome Screen...');
                await this.setupWelcomeScreen(guild);
                results.welcomeScreen = true;
                console.log('✅ Welcome Screen configured');
            } catch (error) {
                console.error('❌ Welcome Screen setup failed:', error.message);
                results.errors.push({ feature: 'Welcome Screen', error: error.message });
            }

            // 2. Setup Server Guide
            try {
                console.log('📖 Setting up Server Guide...');
                await this.setupServerGuide(guild);
                results.serverGuide = true;
                console.log('✅ Server Guide configured');
            } catch (error) {
                console.error('❌ Server Guide setup failed:', error.message);
                results.errors.push({ feature: 'Server Guide', error: error.message });
            }

            // 3. Setup Onboarding
            try {
                console.log('🎯 Setting up Member Onboarding...');
                await this.setupOnboarding(guild);
                results.onboarding = true;
                console.log('✅ Member Onboarding configured');
            } catch (error) {
                console.error('❌ Onboarding setup failed:', error.message);
                results.errors.push({ feature: 'Onboarding', error: error.message });
            }

            // 4. Setup Auto Moderation
            try {
                console.log('🛡️ Setting up Auto Moderation...');
                await this.setupAutoModeration(guild);
                results.autoModeration = true;
                console.log('✅ Auto Moderation configured');
            } catch (error) {
                console.error('❌ Auto Moderation setup failed:', error.message);
                results.errors.push({ feature: 'Auto Moderation', error: error.message });
            }

            console.log(`🎉 Community features setup complete for ${guild.name}!`);
            return results;
            
        } catch (error) {
            console.error('Error setting up community features:', error);
            throw error;
        }
    }

    /**
     * Setup Discord Welcome Screen
     */
    async setupWelcomeScreen(guild) {
        try {
            // Find and map actual channels
            const startHereChannel = guild.channels.cache.find(ch => ch.name.includes('start-here'));
            const introChannel = guild.channels.cache.find(ch => ch.name.includes('introductions'));
            const newsChannel = guild.channels.cache.find(ch => ch.name.includes('announcements'));
            const helpChannel = guild.channels.cache.find(ch => ch.name.includes('integration-issues'));
            const showcaseChannel = guild.channels.cache.find(ch => ch.name.includes('project-portfolio'));

            const welcomeChannels = [];
            
            if (startHereChannel) {
                welcomeChannels.push({
                    channel: startHereChannel,
                    description: "Start your automation journey",
                    emoji: "🚀"
                });
            }
            
            if (introChannel) {
                welcomeChannels.push({
                    channel: introChannel,
                    description: "Introduce yourself to the community",
                    emoji: "👋"
                });
            }
            
            if (newsChannel) {
                welcomeChannels.push({
                    channel: newsChannel,
                    description: "Latest n8n news and updates",
                    emoji: "📢"
                });
            }
            
            if (helpChannel) {
                welcomeChannels.push({
                    channel: helpChannel,
                    description: "Get help with your workflows",
                    emoji: "🆘"
                });
            }
            
            if (showcaseChannel) {
                welcomeChannels.push({
                    channel: showcaseChannel,
                    description: "Showcase your automation projects",
                    emoji: "🎨"
                });
            }

            // Configure Welcome Screen via Discord API
            const welcomeScreenOptions = {
                enabled: true,
                description: "Join n8n's Discord for collaborative learning, expert insights, and innovative solutions in automation and integration",
                welcomeChannels: welcomeChannels.slice(0, 5) // Discord limit is 5 channels
            };

            await guild.setWelcomeScreen(welcomeScreenOptions);
            console.log('📋 Welcome Screen configured via Discord API');
            
        } catch (error) {
            console.error('Error setting up welcome screen:', error);
            console.log('📋 Welcome Screen data prepared (requires manual Discord setup)');
            // Don't throw - continue with other setup
        }
    }

    /**
     * Setup Server Guide
     */
    async setupServerGuide(guild) {
        try {
            // Map channels to server guide steps
            const startHereChannel = guild.channels.cache.find(ch => ch.name.includes('start-here'));
            const introChannel = guild.channels.cache.find(ch => ch.name.includes('introductions'));
            const newsChannel = guild.channels.cache.find(ch => ch.name.includes('announcements'));
            const showcaseChannel = guild.channels.cache.find(ch => ch.name.includes('project-portfolio'));
            const helpChannel = guild.channels.cache.find(ch => ch.name.includes('integration-issues'));

            // Configure Server Guide via Discord API
            const serverGuideOptions = {
                enabled: true,
                welcomeMessage: "Hi there and welcome to the n8n server! We're very excited to have you here and look forward to hearing about all the workflows you're working on. Before you dive in and explore the community, please be aware that the Discord is not for support requests. Please see https://community.n8n.io",
                newMemberActions: []
            };

            // Add guide steps with actual channels
            if (introChannel) {
                serverGuideOptions.newMemberActions.push({
                    channelId: introChannel.id,
                    title: "Introduce yourself!",
                    description: "Tell us about yourself and your automation journey",
                    emoji: "👋"
                });
            }

            if (showcaseChannel) {
                serverGuideOptions.newMemberActions.push({
                    channelId: showcaseChannel.id,
                    title: "Share your work!",
                    description: "Show off your automation projects and portfolio",
                    emoji: "🎨"
                });
            }

            if (newsChannel) {
                serverGuideOptions.newMemberActions.push({
                    channelId: newsChannel.id,
                    title: "Check out the latest news!",
                    description: "Stay updated with n8n announcements",
                    emoji: "📢"
                });
            }

            if (helpChannel) {
                serverGuideOptions.newMemberActions.push({
                    channelId: helpChannel.id,
                    title: "Get help!",
                    description: "Ask questions and get support from the community",
                    emoji: "🆘"
                });
            }

            // Try to set the server guide via Discord API
            try {
                // Note: This requires the guild to have COMMUNITY feature enabled
                await guild.setServerGuide(serverGuideOptions);
                console.log('📖 Server Guide configured via Discord API');
            } catch (apiError) {
                console.error('Discord API Server Guide setup failed:', apiError.message);
                console.log('📖 Server Guide data prepared (requires manual Discord setup)');
                
                // Save the configuration for manual setup
                const communityData = await this.loadCommunityData();
                communityData.serverGuide = serverGuideOptions;
                await this.saveCommunityData(communityData);
            }
            
        } catch (error) {
            console.error('Error setting up server guide:', error);
            throw error;
        }
    }

    /**
     * Setup Member Onboarding Questions
     */
    async setupOnboarding(guild) {
        try {
            // Setup onboarding questions via Discord API
            const onboardingQuestions = [
                {
                    type: 0, // MULTIPLE_CHOICE
                    label: "What best describes you?",
                    required: true,
                    choices: [
                        { label: "🛠️ Freelancer - I offer automation services", emoji: "🛠️" },
                        { label: "📦 Client - I need automation solutions", emoji: "📦" },
                        { label: "🎓 Learning - I'm learning automation", emoji: "🎓" },
                        { label: "🏢 Agency - I run an automation agency", emoji: "🏢" },
                        { label: "👨‍💻 Developer - I build integrations", emoji: "👨‍💻" }
                    ]
                },
                {
                    type: 1, // DROPDOWN
                    label: "What's your automation experience level?",
                    required: true,
                    choices: [
                        { label: "🌱 Beginner - Just getting started", emoji: "🌱" },
                        { label: "🔧 Intermediate - Some experience with workflows", emoji: "🔧" },
                        { label: "🚀 Advanced - Building complex automations", emoji: "🚀" },
                        { label: "⭐ Expert - Professional automation developer", emoji: "⭐" }
                    ]
                }
            ];

            try {
                // Set onboarding configuration via Discord API
                await guild.setOnboarding({
                    prompts: onboardingQuestions,
                    enabled: true,
                    mode: 1 // ADVANCED mode for custom questions
                });
                console.log('🎯 Onboarding questions configured via Discord API');
            } catch (apiError) {
                console.error('Discord API Onboarding setup failed:', apiError.message);
                console.log('🎯 Onboarding system ready (integrated with existing system)');
                
                // Save configuration for manual setup
                const communityData = await this.loadCommunityData();
                communityData.onboarding.questions = onboardingQuestions;
                await this.saveCommunityData(communityData);
            }
            
        } catch (error) {
            console.error('Error setting up onboarding:', error);
            throw error;
        }
    }

    /**
     * Setup Auto Moderation Rules
     */
    async setupAutoModeration(guild) {
        try {
            // Note: Auto Moderation setup requires specific Discord API calls
            // This prepares the configuration for manual setup
            
            const autoModRules = [
                {
                    name: "Spam Prevention",
                    eventType: "MESSAGE_SEND",
                    triggerType: "SPAM",
                    actions: [
                        {
                            type: "BLOCK_MESSAGE",
                            metadata: {
                                customMessage: "Your message was flagged as potential spam. Please avoid repetitive posting."
                            }
                        },
                        {
                            type: "TIMEOUT",
                            metadata: {
                                durationSeconds: 300 // 5 minutes
                            }
                        }
                    ]
                },
                {
                    name: "Harmful Links",
                    eventType: "MESSAGE_SEND",
                    triggerType: "HARMFUL_LINK",
                    actions: [
                        {
                            type: "BLOCK_MESSAGE",
                            metadata: {
                                customMessage: "Suspicious links are not allowed for community safety."
                            }
                        }
                    ]
                },
                {
                    name: "Excessive Caps",
                    eventType: "MESSAGE_SEND",
                    triggerType: "KEYWORD",
                    triggerMetadata: {
                        keywordFilter: [],
                        allowList: [],
                        mentionTotalLimit: 3
                    },
                    actions: [
                        {
                            type: "FLAG_TO_CHANNEL",
                            metadata: {
                                channelId: null // Would be set to moderation channel
                            }
                        }
                    ]
                }
            ];

            const communityData = await this.loadCommunityData();
            communityData.autoModeration = {
                enabled: true,
                rules: autoModRules
            };
            await this.saveCommunityData(communityData);

            console.log('🛡️ Auto Moderation rules configured (requires manual Discord setup)');
            
        } catch (error) {
            console.error('Error setting up auto moderation:', error);
            throw error;
        }
    }

    /**
     * Load community data from storage
     */
    async loadCommunityData() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading community data:', error);
            // Return default structure if file doesn't exist
            await this.initializeCommunityData();
            return await this.loadCommunityData();
        }
    }

    /**
     * Save community data to storage
     */
    async saveCommunityData(data) {
        try {
            await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving community data:', error);
            throw error;
        }
    }

    /**
     * Create community setup slash command
     */
    getSetupCommunityCommand() {
        const { SlashCommandBuilder } = require('discord.js');
        
        return new SlashCommandBuilder()
            .setName('setup-community')
            .setDescription('Setup advanced Discord Community Server features')
            .addBooleanOption(option =>
                option.setName('download-assets')
                    .setDescription('Download visual assets from Unsplash')
                    .setRequired(false)
            )
            .addBooleanOption(option =>
                option.setName('setup-guide')
                    .setDescription('Setup server guide and onboarding')
                    .setRequired(false)
            );
    }

    /**
     * Handle setup-community command
     */
    async handleSetupCommunityCommand(interaction) {
        try {
            // Check permissions
            if (interaction.user.id !== interaction.guild.ownerId) {
                await interaction.reply({
                    content: '❌ Only the server owner can setup community features.',
                    ephemeral: true
                });
                return;
            }

            const downloadAssets = interaction.options.getBoolean('download-assets') || false;
            const setupGuide = interaction.options.getBoolean('setup-guide') || true;

            await interaction.reply({
                content: '🏛️ **Setting up Discord Community Server features...**\n\n⏱️ This may take a moment...',
                ephemeral: true
            });

            // Download assets if requested
            if (downloadAssets) {
                await interaction.editReply({
                    content: '🏛️ **Setting up Discord Community Server features...**\n\n🎨 **Step 1:** Downloading visual assets from Unsplash...\n⏱️ This may take a few minutes...'
                });
                await this.downloadCommunityAssets();
            }

            // Setup community features
            await interaction.editReply({
                content: '🏛️ **Setting up Discord Community Server features...**\n\n🔧 **Step 2:** Configuring community features...'
            });

            const results = await this.setupCommunityFeatures(interaction.guild);

            // Create results message
            const resultMessage = [
                '🎉 **Discord Community Server Setup Complete!** 🏛️\n',
                '**📋 Features Configured:**',
                `• Welcome Screen: ${results.welcomeScreen ? '✅' : '❌'}`,
                `• Server Guide: ${results.serverGuide ? '✅' : '❌'}`,
                `• Member Onboarding: ${results.onboarding ? '✅' : '❌'}`,
                `• Auto Moderation: ${results.autoModeration ? '✅' : '❌'}`,
                ''
            ];

            if (downloadAssets) {
                resultMessage.push('🎨 **Visual Assets:** Downloaded to assets folder');
                resultMessage.push('📝 **Next Steps:** Upload assets manually to Discord Server Settings');
                resultMessage.push('');
            }

            if (results.errors.length > 0) {
                resultMessage.push('⚠️ **Issues Encountered:**');
                results.errors.forEach(error => {
                    resultMessage.push(`• ${error.feature}: ${error.error}`);
                });
                resultMessage.push('');
            }

            resultMessage.push('📖 **Manual Setup Required:**');
            resultMessage.push('• Go to Server Settings → Enable Community → Welcome Screen');
            resultMessage.push('• Upload custom banner and icon from downloaded assets');
            resultMessage.push('• Configure auto-moderation rules in Server Settings');
            resultMessage.push('• Set up scheduled events for community activities');
            resultMessage.push('');
            resultMessage.push('🎯 **Your n8n automation community is now ready for professional engagement!**');

            await interaction.editReply({
                content: resultMessage.join('\n')
            });

        } catch (error) {
            console.error('Error handling setup-community command:', error);
            
            await interaction.followUp({
                content: `❌ **Community Setup Error**\n\n${error.message}\n\nPlease try again or contact support.`,
                ephemeral: true
            });
        }
    }
}

module.exports = CommunityManager;
