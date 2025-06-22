const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

class VegasHandler {
    constructor() {
        this.vegasColors = {
            gold: '#FFD700',
            neon: '#FF1493',
            electric: '#00FFFF',
            fire: '#FF4500',
            diamond: '#B9F2FF',
            stellar: '#9966CC'
        };
        
        this.automationTips = [
            "🎯 **Pro Tip:** Use webhooks to trigger workflows from external apps - it's like having a magic doorbell!",
            "⚡ **Speed Hack:** Batch process data instead of handling items one by one - your workflows will thank you!",
            "🔄 **Game Changer:** Set up error handling in every workflow - because even automation needs a safety net!",
            "🎪 **Vegas Secret:** Use the HTTP Request node to connect ANYTHING - the possibilities are endless!",
            "💎 **Diamond Advice:** Always test workflows with sample data before going live - trust but verify!",
            "🎲 **Lucky Break:** Use expressions to transform data on the fly - `{{ $json.field }}` is your best friend!",
            "🌟 **Star Power:** Schedule workflows to run automatically - set it and forget it like a slot machine!",
            "🔥 **Hot Tip:** Use the Code node for complex logic - sometimes you need that custom touch!",
            "🎰 **Jackpot:** Monitor your workflows with notifications - know when they hit the automation jackpot!",
            "✨ **Magic Touch:** Use the SplitInBatches node for large datasets - handle big data like a high roller!"
        ];
        
        this.eightBallResponses = [
            "🎰 **The automation gods smile upon you!** Your project will be a jackpot!",
            "🔥 **Absolutely blazing!** This automation will set the industry on fire!",
            "💎 **Diamond certainty!** Your workflow will shine brighter than Vegas lights!",
            "⚡ **Electric potential!** The energy around this project is through the roof!",
            "🌟 **Written in the stars!** This automation is destined for greatness!",
            "🎪 **The show must go on!** Your project has main stage potential!",
            "🎯 **Bulls-eye prediction!** You're hitting the automation target perfectly!",
            "🃏 **The cards are in your favor!** Lady Luck loves this automation idea!",
            "🎲 **Snake eyes say... YES!** Roll with this project, it's a winner!",
            "🏆 **Champion material!** This automation belongs in the Hall of Fame!",
            "⚠️ **Proceed with caution...** The automation spirits are uncertain about this one.",
            "🌪️ **Stormy forecast!** Maybe revisit this automation when the winds change.",
            "🎭 **Plot twist incoming!** This project might surprise you in unexpected ways.",
            "🔮 **The crystal ball is cloudy...** Try asking again with more specific details!",
            "🎨 **Back to the drawing board!** This automation needs more creative energy!"
        ];
    }

    // 🎰 FAQ HANDLER
    async handleFaqCommand(interaction) {
        const topic = interaction.options.getString('topic');
        
        if (!topic) {
            // Show main FAQ menu
            await this.showMainFaqMenu(interaction);
            return;
        }
        
        await this.showTopicFaq(interaction, topic);
    }

    async showMainFaqMenu(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎰 **WELCOME TO n8n VEGAS CONVENTION CENTER!** 🎰')
            .setColor(this.vegasColors.gold)
            .setDescription(
                '✨ **The most GLITZY automation community in the digital universe!** ✨\n\n' +
                '🎪 **Choose your adventure below or use:** `/faq [topic]`\n' +
                '🎯 **Pro Tip:** Every command here is designed to make automation FUN and PROFITABLE!'
            )
            .addFields([
                {
                    name: '💰 **MONEY SYSTEM** 💰',
                    value: '`/faq money` - Track your automation empire, climb leaderboards, show off your earnings!',
                    inline: false
                },
                {
                    name: '🏆 **LEADERBOARDS** 🏆', 
                    value: '`/faq leaderboards` - Become the automation celebrity you were born to be!',
                    inline: false
                },
                {
                    name: '🎯 **ROLES & BADGES** 🎯',
                    value: '`/faq roles` - Unlock exclusive status, get verified, join the elite!',
                    inline: false
                },
                {
                    name: '🎪 **INTERACTIVE FEATURES** 🎪',
                    value: '`/faq interactive` - All the bells, whistles, and Vegas magic!',
                    inline: false
                },
                {
                    name: '💼 **MARKETPLACE MAGIC** 💼',
                    value: '`/faq marketplace` - Find dream projects, hire top talent!',
                    inline: false
                },
                {
                    name: '🎮 **FUN COMMANDS** 🎮',
                    value: '`/faq fun` - Easter eggs, games, and pure entertainment!',
                    inline: false
                }
            ])
            .setFooter({ text: '🎲 Try /tip for random automation wisdom • /slots for some fun!' })
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('faq_money')
                    .setLabel('💰 Money System')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💰'),
                new ButtonBuilder()
                    .setCustomId('faq_leaderboards')
                    .setLabel('🏆 Leaderboards')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🏆'),
                new ButtonBuilder()
                    .setCustomId('faq_interactive')
                    .setLabel('🎪 Features')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎪')
            );

        await interaction.reply({ embeds: [embed], components: [buttons] });
    }

    async showTopicFaq(interaction, topic) {
        const faqContent = this.getFaqContent(topic);
        
        const embed = new EmbedBuilder()
            .setTitle(faqContent.title)
            .setColor(faqContent.color)
            .setDescription(faqContent.description)
            .addFields(faqContent.fields)
            .setFooter({ text: faqContent.footer })
            .setTimestamp();

        if (faqContent.buttons) {
            await interaction.reply({ embeds: [embed], components: [faqContent.buttons] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    }

    getFaqContent(topic) {
        const content = {
            money: {
                title: '💰 **MONEY SYSTEM - YOUR AUTOMATION EMPIRE DASHBOARD!** 💰',
                color: this.vegasColors.gold,
                description: '🎰 **Track your success like a HIGH ROLLER!** 🎰\n\nThe Money System is your personal Vegas casino - but YOU always win!',
                fields: [
                    {
                        name: '🎯 **Getting Started**',
                        value: '• `/money dashboard` - Your main control center\n• `/money update revenue 5000` - Log your monthly earnings\n• `/money project "Client Website" 2500` - Add completed projects',
                        inline: false
                    },
                    {
                        name: '📊 **Tracking Features**',
                        value: '• **Monthly Revenue** - Show off your earning power\n• **Project Count** - Flex those completed automations\n• **Hourly Rate** - Display your premium value\n• **Growth Stats** - Watch your empire expand!',
                        inline: false
                    },
                    {
                        name: '🏆 **Leaderboards & Recognition**',
                        value: '• `/money leaderboard monthly` - See top earners\n• `/money leaderboard growth` - Fastest growing pros\n• `/money leaderboard projects` - Most productive automators\n• **Privacy Controls** - You control what you share!',
                        inline: false
                    },
                    {
                        name: '🎮 **Quick Commands**',
                        value: '• `/money dashboard` - Main overview\n• `/money stats` - Community statistics\n• `/money privacy` - Control your visibility\n• Interactive buttons for fast updates!',
                        inline: false
                    }
                ],
                footer: '💎 Pro Tip: Use the interactive buttons in your dashboard for quick updates!',
                buttons: new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('demo_money_dashboard')
                            .setLabel('Try Money Dashboard')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('💰')
                    )
            },
            leaderboards: {
                title: '🏆 **LEADERBOARDS - CLIMB TO AUTOMATION FAME!** 🏆',
                color: this.vegasColors.fire,
                description: '🎪 **Become the STAR of the automation world!** 🎪\n\nTwo types of fame await you in Vegas!',
                fields: [
                    {
                        name: '💬 **Community Leaderboards**',
                        value: '• **Most Active** - Top contributors and helpers\n• **Most Helpful** - Solutions and solved posts\n• **Template Shares** - Workflow sharing champions\n• **Rising Stars** - New members making waves!',
                        inline: false
                    },
                    {
                        name: '💰 **Financial Leaderboards**',
                        value: '• **Top Earners** - Monthly revenue champions\n• **Biggest Growth** - Fastest expanding businesses\n• **Most Projects** - Productivity superstars\n• **Highest Rates** - Premium value providers',
                        inline: false
                    },
                    {
                        name: '🎯 **How to Climb**',
                        value: '• **Be Helpful** - Answer questions, share knowledge\n• **Share Templates** - Post amazing workflows\n• **Track Earnings** - Use `/money` commands\n• **Stay Active** - Engage with the community!',
                        inline: false
                    }
                ],
                footer: '🌟 New leaderboards reset monthly - fresh chances to shine!',
                buttons: new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('demo_leaderboard')
                            .setLabel('View Leaderboards')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🏆')
                    )
            },
            interactive: {
                title: '🎪 **INTERACTIVE FEATURES - ALL THE VEGAS MAGIC!** 🎪',
                color: this.vegasColors.neon,
                description: '✨ **Every interaction is designed for MAXIMUM FUN!** ✨',
                fields: [
                    {
                        name: '🎰 **Fun Commands**',
                        value: '• `/slots` - Try the automation slot machine!\n• `/8ball` - Ask the automation oracle\n• `/tip` - Random automation wisdom\n• `/celebrate` - Vegas-style celebrations!',
                        inline: false
                    },
                    {
                        name: '🎯 **Utility Commands**',
                        value: '• `/signboard` - Interactive information stations\n• `/showcase` - Feature demonstrations\n• `/mood` - Set your automation vibe\n• `/faq` - This comprehensive help system!',
                        inline: false
                    },
                    {
                        name: '💼 **Professional Tools**',
                        value: '• `/profile` - Your professional showcase\n• `/interview` - Private client discussions\n• `/onboard` - Personalized setup experience\n• Interactive buttons and menus everywhere!',
                        inline: false
                    }
                ],
                footer: '🎲 Every command has hidden easter eggs and surprises!',
                buttons: new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('demo_showcase')
                            .setLabel('Try Showcase')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🎪')
                    )
            },
            roles: {
                title: '🎯 **ROLES & BADGES - UNLOCK YOUR STATUS!** 🎯',
                color: this.vegasColors.diamond,
                description: '👑 **Rise through the ranks of automation royalty!** 👑',
                fields: [
                    {
                        name: '🛠️ **Freelancer Role**',
                        value: 'Perfect for independent automation experts offering services',
                        inline: true
                    },
                    {
                        name: '📦 **Client Role**', 
                        value: 'For businesses seeking automation solutions and talent',
                        inline: true
                    },
                    {
                        name: '🚀 **Verified Pro**',
                        value: 'Elite status for proven automation experts with track records',
                        inline: true
                    },
                    {
                        name: '🎓 **How to Get Verified**',
                        value: '• Demonstrate expertise in forums\n• Share high-quality templates\n• Help community members\n• Build reputation through contributions',
                        inline: false
                    }
                ],
                footer: '🌟 Roles unlock special channels and privileges!',
                buttons: null
            },
            marketplace: {
                title: '💼 **MARKETPLACE MAGIC - WHERE BUSINESS HAPPENS!** 💼',
                color: this.vegasColors.electric,
                description: '🎯 **The ultimate automation business hub!** 🎯',
                fields: [
                    {
                        name: '🔍 **For Clients**',
                        value: '• Post projects in `#💼┃post-a-job`\n• Browse talent in `#🙋‍♂️┃available-for-hire`\n• Check portfolios in `#🎨┃project-portfolio`\n• Use `/interview start` for private discussions',
                        inline: false
                    },
                    {
                        name: '💪 **For Freelancers**',
                        value: '• Showcase skills in `#🙋‍♂️┃available-for-hire`\n• Display work in `#🎨┃project-portfolio`\n• Track earnings with `/money` commands\n• Build reputation through community help',
                        inline: false
                    },
                    {
                        name: '🏆 **Elite Features**',
                        value: '• `#💎┃elite-listings` for Verified Pros\n• `#⭐┃client-reviews` for testimonials\n• Private matching for premium projects\n• Financial leaderboards for credibility',
                        inline: false
                    }
                ],
                footer: '💰 Track your marketplace success with the money system!',
                buttons: null
            },
            fun: {
                title: '🎮 **FUN COMMANDS - PURE ENTERTAINMENT!** 🎮',
                color: this.vegasColors.stellar,
                description: '🎪 **Because automation should be FUN!** 🎪',
                fields: [
                    {
                        name: '🎰 **Casino Games**',
                        value: '• `/slots` - Automation-themed slot machine\n• `/8ball [question]` - Automation oracle wisdom\n• Random automation tips and jokes',
                        inline: false
                    },
                    {
                        name: '🎊 **Celebrations**',
                        value: '• `/celebrate [achievement]` - Vegas-style fanfare\n• `/mood [vibe]` - Set your automation energy\n• Achievement unlocks and badges',
                        inline: false
                    },
                    {
                        name: '🎭 **Easter Eggs**',
                        value: '• Hidden responses in commands\n• Special messages for milestones\n• Seasonal events and themes\n• Surprise interactions throughout!',
                        inline: false
                    }
                ],
                footer: '🎲 Try different commands to discover all the hidden surprises!',
                buttons: new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('demo_fun_commands')
                            .setLabel('Try Fun Commands')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🎮')
                    )
            },
            'getting-started': {
                title: '🚀 **GETTING STARTED - YOUR AUTOMATION JOURNEY!** 🚀',
                color: this.vegasColors.fire,
                description: '🎯 **Welcome to the most exciting automation community!** 🎯',
                fields: [
                    {
                        name: '1️⃣ **Complete Onboarding**',
                        value: '• Run `/onboard` for personalized setup\n• Get matched with perfect channels\n• Receive role assignments\n• Join the community that fits you!',
                        inline: false
                    },
                    {
                        name: '2️⃣ **Explore the Convention Center**',
                        value: '• Check out `/signboard lobby` for orientation\n• Visit different themed areas\n• Read channel descriptions for guidance\n• Use `/help` for specific topics',
                        inline: false
                    },
                    {
                        name: '3️⃣ **Start Contributing**',
                        value: '• Share your automation experience\n• Ask questions in forum channels\n• Help others with their challenges\n• Track your progress with `/money` and `/profile`',
                        inline: false
                    }
                ],
                footer: '🌟 The more you engage, the more you unlock!',
                buttons: new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('start_onboarding')
                            .setLabel('Start Onboarding')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('🚀')
                    )
            }
        };
        
        return content[topic] || content['getting-started'];
    }

    // 🎯 SIGNBOARD HANDLER
    async handleSignboardCommand(interaction) {
        const location = interaction.options.getString('location') || 'lobby';
        const signboard = this.getSignboardContent(location);
        
        const embed = new EmbedBuilder()
            .setTitle(signboard.title)
            .setColor(signboard.color)
            .setDescription(signboard.content)
            .setFooter({ text: signboard.footer })
            .setTimestamp();

        if (signboard.image) {
            embed.setImage(signboard.image);
        }

        await interaction.reply({ embeds: [embed], ephemeral: signboard.ephemeral || false });
    }

    getSignboardContent(location) {
        const signboards = {
            lobby: {
                title: '🎰 **WELCOME TO n8n VEGAS CONVENTION CENTER!** 🎰',
                color: this.vegasColors.gold,
                content: '🌟 **THE MOST SPECTACULAR AUTOMATION COMMUNITY!** 🌟\n\n' +
                        '🎪 **YOU ARE NOW ENTERING:**\n' +
                        '• The hottest automation marketplace\n' +
                        '• Where freelancers become legends\n' +
                        '• Where clients find dream teams\n' +
                        '• Where every automation tells a story\n\n' +
                        '🎯 **QUICK START GUIDE:**\n' +
                        '• `/onboard` - Get your personalized experience\n' +
                        '• `/faq` - Everything you need to know\n' +
                        '• `/signboard money-counter` - Track your empire\n' +
                        '• `/slots` - Try your luck!\n\n' +
                        '✨ **Remember:** Every interaction here is designed for maximum FUN and SUCCESS!',
                footer: '🎲 Pro Tip: Use /signboard [location] to explore different areas!',
                ephemeral: false
            },
            'money-counter': {
                title: '💰 **MONEY COUNTER - FINANCIAL TRACKING STATION** 💰',
                color: this.vegasColors.gold,
                content: '🏦 **YOUR PERSONAL VEGAS BANK!** 🏦\n\n' +
                        '💎 **WHAT YOU CAN DO HERE:**\n' +
                        '• Track monthly and annual revenue\n' +
                        '• Log completed automation projects\n' +
                        '• Set and monitor financial goals\n' +
                        '• Compete on earnings leaderboards\n' +
                        '• Control your privacy settings\n\n' +
                        '🎯 **ESSENTIAL COMMANDS:**\n' +
                        '• `/money dashboard` - Your main financial hub\n' +
                        '• `/money update revenue 5000` - Log monthly earnings\n' +
                        '• `/money project "Big Client" 3000` - Add projects\n' +
                        '• `/money leaderboard` - See top performers\n' +
                        '• `/money privacy` - Control what you share\n\n' +
                        '🏆 **CLIMB THE LEADERBOARDS:**\n' +
                        'Show off your automation empire and inspire others!',
                footer: '💰 Your financial data is private by default - you control what you share!',
                ephemeral: true
            },
            'hall-of-fame': {
                title: '🏆 **HALL OF FAME - LEADERBOARD CENTRAL** 🏆',
                color: this.vegasColors.fire,
                content: '🌟 **WHERE AUTOMATION LEGENDS ARE BORN!** 🌟\n\n' +
                        '🎪 **COMMUNITY LEADERBOARDS:**\n' +
                        '• Most Active Contributors - The helpful heroes\n' +
                        '• Most Helpful (Solved Tags) - Problem solvers\n' +
                        '• Template Sharing Champions - Knowledge givers\n' +
                        '• Rising Stars - New members making waves\n\n' +
                        '💰 **FINANCIAL LEADERBOARDS:**\n' +
                        '• Top Monthly Earners - Revenue champions\n' +
                        '• Biggest Growth - Fastest expanding pros\n' +
                        '• Most Projects - Productivity superstars\n' +
                        '• Highest Rates - Premium providers\n\n' +
                        '🎯 **HOW TO CLIMB:**\n' +
                        '• Help community members daily\n' +
                        '• Share amazing workflow templates\n' +
                        '• Track your earnings with `/money`\n' +
                        '• Stay active and engaged!',
                footer: '🌟 Leaderboards reset monthly - fresh chances to shine!',
                ephemeral: false
            },
            'feature-theater': {
                title: '🎪 **FEATURE THEATER - INTERACTIVE SHOWCASE** 🎪',
                color: this.vegasColors.neon,
                content: '✨ **ALL THE VEGAS MAGIC IN ONE PLACE!** ✨\n\n' +
                        '🎰 **ENTERTAINMENT COMMANDS:**\n' +
                        '• `/slots` - Automation slot machine fun\n' +
                        '• `/8ball [question]` - Oracle wisdom\n' +
                        '• `/tip` - Random automation insights\n' +
                        '• `/celebrate [win]` - Vegas-style parties\n\n' +
                        '🎯 **UTILITY SHOWCASES:**\n' +
                        '• `/showcase` - Feature demonstrations\n' +
                        '• `/mood [vibe]` - Set your energy\n' +
                        '• `/profile` - Professional showcase\n' +
                        '• `/poll` - Community decision making\n\n' +
                        '🏆 **PROFESSIONAL TOOLS:**\n' +
                        '• `/interview start` - Private client rooms\n' +
                        '• `/money dashboard` - Financial tracking\n' +
                        '• `/leaderboard` - Community rankings\n' +
                        '• Interactive buttons and menus everywhere!',
                footer: '🎲 Every command has surprises - explore them all!',
                ephemeral: false
            },
            analytics: {
                title: '📊 **ANALYTICS DASHBOARD - COMMUNITY STATS** 📊',
                color: this.vegasColors.electric,
                content: '📈 **REAL-TIME COMMUNITY PULSE!** 📈\n\n' +
                        '🎯 **COMMUNITY METRICS:**\n' +
                        '• Total active automation professionals\n' +
                        '• Monthly project completions\n' +
                        '• Combined community revenue\n' +
                        '• Average hourly rates by expertise\n' +
                        '• Most popular automation categories\n\n' +
                        '💰 **FINANCIAL INSIGHTS:**\n' +
                        '• Use `/money stats` for aggregated data\n' +
                        '• Privacy-protected community averages\n' +
                        '• Growth trends and market insights\n' +
                        '• Success story highlights\n\n' +
                        '🏆 **ENGAGEMENT STATS:**\n' +
                        '• Most active discussion topics\n' +
                        '• Popular workflow templates\n' +
                        '• Community contribution leaders\n' +
                        '• Weekly spotlight analytics',
                footer: '📊 All data is anonymized and privacy-protected!',
                ephemeral: true
            },
            'game-zone': {
                title: '🎮 **GAME ZONE - FUN COMMANDS CENTRAL** 🎮',
                color: this.vegasColors.stellar,
                content: '🎪 **WHERE AUTOMATION MEETS ENTERTAINMENT!** 🎪\n\n' +
                        '🎰 **CASINO GAMES:**\n' +
                        '• `/slots` - Automation-themed slot machine\n' +
                        '• `/8ball` - Ask automation questions\n' +
                        '• Random automation wisdom and jokes\n' +
                        '• Hidden easter eggs in commands\n\n' +
                        '🎊 **CELEBRATION STATION:**\n' +
                        '• `/celebrate` - Vegas-style fanfare\n' +
                        '• `/mood` - Set your automation vibe\n' +
                        '• Achievement unlocks and badges\n' +
                        '• Milestone celebrations\n\n' +
                        '🎭 **DISCOVERY ZONE:**\n' +
                        '• Try different command combinations\n' +
                        '• Look for seasonal event features\n' +
                        '• Explore interactive buttons and menus\n' +
                        '• Share your discoveries with others!',
                footer: '🎲 The more you explore, the more surprises you find!',
                ephemeral: false
            }
        };
        
        return signboards[location] || signboards.lobby;
    }

    // 🎲 TIP HANDLER
    async handleTipCommand(interaction) {
        const randomTip = this.automationTips[Math.floor(Math.random() * this.automationTips.length)];
        
        const embed = new EmbedBuilder()
            .setTitle('🎲 **AUTOMATION WISDOM FROM THE VEGAS VAULT!** 🎲')
            .setColor(this.vegasColors.stellar)
            .setDescription(randomTip)
            .setFooter({ text: '🎯 Use /tip again for more wisdom • Share your own tips in the community!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // 🎰 SLOTS HANDLER
    async handleSlotsCommand(interaction) {
        const symbols = ['🔧', '⚡', '🎯', '💎', '🚀', '🎪', '💰', '🏆'];
        const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
        const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
        const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
        
        const isWin = slot1 === slot2 && slot2 === slot3;
        const isNearWin = (slot1 === slot2) || (slot2 === slot3) || (slot1 === slot3);
        
        let result = '';
        let color = this.vegasColors.electric;
        
        if (isWin) {
            result = '🎉 **JACKPOT!** 🎉\nYou hit the automation jackpot! Your next project will be legendary!';
            color = this.vegasColors.gold;
        } else if (isNearWin) {
            result = '⚡ **SO CLOSE!** ⚡\nYour automation skills are heating up! Try again!';
            color = this.vegasColors.fire;
        } else {
            result = '🎲 **Keep Spinning!** 🎲\nEvery automation expert started somewhere! Your winning streak is coming!';
            color = this.vegasColors.neon;
        }

        const embed = new EmbedBuilder()
            .setTitle('🎰 **n8n AUTOMATION SLOT MACHINE** 🎰')
            .setColor(color)
            .setDescription(`🎯 **SPINNING...** 🎯\n\n🎰 **[ ${slot1} | ${slot2} | ${slot3} ]** 🎰\n\n${result}`)
            .setFooter({ text: '🎪 Pure entertainment • Try /8ball for automation advice!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // 🔮 8BALL HANDLER
    async handleEightBallCommand(interaction) {
        const question = interaction.options.getString('question');
        const response = this.eightBallResponses[Math.floor(Math.random() * this.eightBallResponses.length)];
        
        const embed = new EmbedBuilder()
            .setTitle('🔮 **THE AUTOMATION ORACLE SPEAKS!** 🔮')
            .setColor(this.vegasColors.stellar)
            .addFields([
                {
                    name: '❓ **Your Question:**',
                    value: question,
                    inline: false
                },
                {
                    name: '🎯 **Oracle\'s Wisdom:**',
                    value: response,
                    inline: false
                }
            ])
            .setFooter({ text: '🎲 The oracle sees all automation possibilities!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // 🎊 CELEBRATE HANDLER
    async handleCelebrateCommand(interaction) {
        const achievement = interaction.options.getString('achievement') || 'automation success';
        
        const celebrations = [
            '🎉🎊🎉 **SPECTACULAR!** 🎉🎊🎉',
            '🏆✨🏆 **LEGENDARY!** 🏆✨🏆',
            '🎪🌟🎪 **MAGNIFICENT!** 🎪🌟🎪',
            '🎯💎🎯 **BRILLIANT!** 🎯💎🎯',
            '🚀⚡🚀 **INCREDIBLE!** 🚀⚡🚀'
        ];
        
        const randomCelebration = celebrations[Math.floor(Math.random() * celebrations.length)];
        
        const embed = new EmbedBuilder()
            .setTitle('🎊 **VEGAS-STYLE CELEBRATION!** 🎊')
            .setColor(this.vegasColors.gold)
            .setDescription(
                `${randomCelebration}\n\n` +
                `🎪 **Celebrating:** ${achievement}\n\n` +
                '🎰 *The lights are flashing, the crowd is cheering, and the automation world is celebrating your amazing achievement!*\n\n' +
                '🌟 *You\'ve just added another success story to the n8n Vegas Convention Center Hall of Fame!*'
            )
            .setFooter({ text: '🎲 Share your wins with the community!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // 🎵 MOOD HANDLER
    async handleMoodCommand(interaction) {
        const vibe = interaction.options.getString('vibe') || 'stellar';
        
        const moods = {
            fire: {
                title: '🔥 **FIRE MODE ACTIVATED!** 🔥',
                description: 'You\'re blazing hot and ready to automate EVERYTHING! The energy is through the roof!',
                color: this.vegasColors.fire
            },
            diamond: {
                title: '💎 **DIAMOND LUXURY MODE!** 💎',
                description: 'Feeling premium and polished! Your automation work shines like the finest diamonds in Vegas!',
                color: this.vegasColors.diamond
            },
            stellar: {
                title: '🌟 **STELLAR SUPERSTAR MODE!** 🌟',
                description: 'You\'re on top of the automation world! The stars align for your success!',
                color: this.vegasColors.stellar
            },
            electric: {
                title: '⚡ **ELECTRIC ENERGY MODE!** ⚡',
                description: 'Buzzing with automation energy! You\'re charged up and ready to shock the world!',
                color: this.vegasColors.electric
            },
            focused: {
                title: '🎯 **LASER FOCUS MODE!** 🎯',
                description: 'In the zone and locked in! Your automation precision is legendary!',
                color: this.vegasColors.neon
            },
            playful: {
                title: '🎪 **PLAYFUL PARTY MODE!** 🎪',
                description: 'Fun and games while getting things done! Automation has never been this entertaining!',
                color: this.vegasColors.gold
            }
        };
        
        const currentMood = moods[vibe] || moods.stellar;
        
        const embed = new EmbedBuilder()
            .setTitle(currentMood.title)
            .setColor(currentMood.color)
            .setDescription(`${currentMood.description}\n\n🎰 *The n8n Vegas Convention Center lighting has been adjusted to match your vibe!*`)
            .setFooter({ text: '🎵 Your mood sets the energy for amazing automation work!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}

module.exports = VegasHandler;
