# n8n Professional Network Bot

A comprehensive Discord bot designed for the n8n Professional Network community. This bot automatically sets up Discord servers with pre-configured roles, channels, and advanced features like weekly spotlights and interview coordination for n8n professionals, freelancers, and clients.

## 🚀 Features

- **Automated Server Setup**: Creates roles and channels based on community blueprints
- **Role Management**: Assign/remove roles with intelligent permission handling  
- **Channel Organization**: Structured categories for different community needs
- **Weekly Spotlight Automation**: Automated content posting with external integrations
- **Interview Coordination**: Private channel creation for client-freelancer meetings
- **Error Recovery**: Intelligent error handling with actionable suggestions
- **Dry Run Mode**: Test configurations without making actual changes

## 📋 Prerequisites

- Node.js 16.9.0 or higher
- Discord bot token with appropriate permissions
- Server administrator access to target Discord server

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd n8n-discord-builder
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
DISCORD_TOKEN=your_discord_bot_token_here
TZ=UTC
DRY_RUN=false
```

**Environment Variables:**
- `DISCORD_TOKEN`: Your Discord bot token (required)
- `TZ`: Timezone for spotlight automation (default: UTC)
- `DRY_RUN`: Set to `true` to test without making changes (default: false)

### 3. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy the bot token to your `.env` file
4. Navigate to OAuth2 > URL Generator
5. Select the following scopes and permissions:

**Required Scopes:**
- `bot`
- `applications.commands`

**Required Bot Permissions:**
- ✅ Manage Roles
- ✅ Manage Channels  
- ✅ Manage Messages
- ✅ Send Messages
- ✅ Create Public Threads
- ✅ Send Messages in Threads
- ✅ Manage Threads
- ✅ Embed Links
- ✅ Attach Files
- ✅ Read Message History
- ✅ Use Slash Commands
- ✅ Manage Webhooks (optional - for advanced integrations)

**Permission Integer:** `8590459904`

### 4. Invite Bot to Server

Use this example invite URL (replace `YOUR_CLIENT_ID` with your bot's client ID):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8590459904&scope=bot%20applications.commands
```

### 5. Run the Bot

**Local Development:**
```bash
node src/index.js
```

**With PM2 (Production):**
```bash
npm install -g pm2
pm2 start src/index.js --name "n8n-discord-bot"
pm2 save
pm2 startup
```

## 📁 Project Structure

```
n8n-discord-builder/
├── src/
│   ├── index.js                 # Main bot entry point
│   ├── commands/                # Slash command definitions
│   │   ├── roleCommands.js      # Role management commands
│   │   ├── channelCommands.js   # Channel management commands
│   │   └── spotlightCommands.js # Spotlight automation commands
│   ├── modules/                 # Core functionality modules
│   │   ├── roleManager.js       # Role creation and management
│   │   ├── channelManager.js    # Channel creation and permissions
│   │   ├── spotlightManager.js  # Weekly spotlight automation
│   │   └── guildStateManager.js # State management and error handling
│   ├── config/
│   │   └── blueprint.json       # Server structure blueprint
│   └── data/                    # Runtime data storage
│       ├── roleData.json        # Guild role mappings
│       ├── channelData.json     # Guild channel mappings
│       └── spotlight.json       # Spotlight configuration and data
├── tests/                       # Test files
├── scripts/                     # Utility scripts
├── .env                         # Environment variables
├── package.json                 # Dependencies and scripts
├── serverBlueprint.json         # Template for custom configurations
└── README.md                    # This file
```

## 🎯 Commands Overview

### Setup Commands

| Command | Description | Required Permission |
|---------|-------------|-------------------|
| `/setup` | Initialize server with roles and channels | Server Owner |

### Role Management

| Command | Description | Required Permission |
|---------|-------------|-------------------|
| `/assign-role <user> <role>` | Assign role to user | Manage Roles |
| `/remove-role <user> <role>` | Remove role from user | Manage Roles |
| `/list-roles` | Show all n8n community roles | Send Messages |
| `/sync-pro-builder` | Auto-sync Pro Builder roles | Manage Roles |

### Channel Management

| Command | Description | Required Permission |
|---------|-------------|-------------------|
| `/list-channels` | Show all community channels | Send Messages |
| `/channel-info <channel>` | Get detailed channel information | Send Messages |
| `/sync-channel-permissions` | Update channel permissions | Manage Channels |

### Interview System

| Command | Description | Required Permission |
|---------|-------------|-------------------|
| `/interview start <candidate> [duration]` | Create private interview channel | Manage Channels |

### Spotlight Automation

| Command | Description | Required Permission |
|---------|-------------|-------------------|
| `/test-spotlight` | Trigger manual spotlight post | Manage Messages |
| `/spotlight-status` | Check automation status | Send Messages |
| `/spotlight-control start/stop/restart` | Control automation | Administrator |
| `/spotlight-config <subcommand>` | Configure integrations | Administrator |

## 🏗️ Server Blueprint

The bot uses `src/config/blueprint.json` to define the server structure. This includes:

### Roles Created:
- 🛠️ **Freelancer** - Independent automation experts
- 📦 **Client** - Businesses seeking automation
- 🚀 **Verified Pro** - Top-tier verified talent  
- 👑 **Admin** - Server administrators

### Channel Categories:
- 👋 **Welcome** - Start here, introductions, announcements
- 🎯 **Find Experts** - Job postings and project listings
- 🚀 **Hire Me Zone** - Freelancer availability and portfolios
- 💬 **Automation Chat** - Technical discussions and solutions
- ⚒️ **Build & Learn** - Templates, plugins, and development
- 🤝 **Collab Lounge** - Partnership and team-building
- 🏆 **Verified Talent** - Elite listings and reviews
- ☕ **Lounge** - General chat and off-topic
- 🔒 **Client ↔ Talent** - Private matching and negotiations

## ⚙️ Configuration

### Custom Server Blueprint

Copy `serverBlueprint.json` to create custom configurations:

```bash
cp serverBlueprint.json custom-blueprint.json
# Edit custom-blueprint.json with your requirements
# Update src/modules/roleManager.js and channelManager.js to use your custom file
```

### Spotlight Configuration

Configure external data sources for weekly spotlights:

**Enable n8n Integration:**
```
/spotlight-config enable-n8n webhook-url:https://your-n8n-instance.com/webhook/spotlight
```

**Enable Google Sheets:**
```
/spotlight-config enable-gsheets sheet-url:https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID
```

**Configure Settings:**
```
/spotlight-config set-max-pins count:4
/spotlight-config view
```

## 🚀 Deployment Options

### Option 1: Local Development
```bash
node src/index.js
```

### Option 2: PM2 (Recommended for VPS)
```bash
npm install -g pm2
pm2 start src/index.js --name "n8n-discord-bot"
pm2 save
pm2 startup
```

### Option 3: Render.com Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set environment variables:
   - `DISCORD_TOKEN`: Your bot token
   - `TZ`: Your timezone (e.g., "UTC", "America/New_York")
4. Use build command: `npm install`
5. Use start command: `node src/index.js`

### Option 4: Glitch Deployment

1. Import your project to Glitch
2. Create `.env` file with:
   ```
   DISCORD_TOKEN=your_token_here
   TZ=UTC
   ```
3. Glitch will automatically start your bot

### Option 5: Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

```bash
docker build -t n8n-discord-bot .
docker run -e DISCORD_TOKEN=your_token_here -e TZ=UTC n8n-discord-bot
```

## 🔧 Troubleshooting

### Common Issues

**Bot doesn't respond to commands:**
- Check bot is online and invited with correct permissions
- Verify slash commands are registered (restart bot if needed)
- Ensure bot has permission to read/send messages in the channel

**Setup fails with permission errors:**
- Bot needs "Manage Roles" and "Manage Channels" permissions
- Bot's role must be higher than roles it tries to manage
- Check server's role hierarchy

**Spotlight automation not working:**
- Verify channel "#weekly-spotlight" exists
- Check bot has permission to post and pin messages
- Review `/spotlight-status` for error details

### Error Recovery

The bot includes intelligent error recovery:
- Permission issues are detected and explained
- Failed setup items can be retried by running `/setup` again
- Rate limiting is handled with automatic retry logic
- Detailed error messages include specific fix suggestions

### Logs and Monitoring

**PM2 Monitoring:**
```bash
pm2 logs n8n-discord-bot
pm2 monit
```

**Manual Logging:**
- All errors are logged to console with timestamps
- Setup operations include detailed progress reporting
- Spotlight automation logs weekly activity

## 🔐 Security Considerations

- Keep your `.env` file secure and never commit tokens to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your Discord bot token
- Review bot permissions periodically
- Monitor bot activity for unexpected behavior

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with `DRY_RUN=true`
5. Submit a pull request

## 🔄 Bot Management

### Update Bot Scopes/Permissions

To update bot permissions after initial invite:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to OAuth2 > URL Generator
4. Generate new invite URL with updated permissions
5. Use the new URL to re-invite bot (existing permissions will be updated)

### Revoke Bot Access

**To remove bot from server:**
1. Go to Server Settings > Integrations
2. Find your bot and click "Remove"

**To revoke bot token:**
1. Go to Discord Developer Portal
2. Select your application > Bot
3. Click "Regenerate" next to Token
4. Update your `.env` file with new token

### Update Permissions via Developer Portal

**Required Bot Permissions Checklist:**
- [x] Manage Roles (268435456)
- [x] Manage Channels (16)  
- [x] Manage Messages (8192)
- [x] Send Messages (2048)
- [x] Create Public Threads (34359738368)
- [x] Send Messages in Threads (274877906944)
- [x] Manage Threads (17179869184)
- [x] Embed Links (16384)
- [x] Attach Files (32768)
- [x] Read Message History (65536)
- [x] Use Slash Commands (2147483648)

**Optional Advanced Permissions:**
- [ ] Manage Webhooks (536870912)
- [ ] Administrator (8) - *Not recommended for security*

## 📞 Support

For issues, questions, or contributions:
- Check existing GitHub issues
- Review troubleshooting section
- Test with `DRY_RUN=true` to debug configuration issues
- Include error logs and bot configuration when reporting issues

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
