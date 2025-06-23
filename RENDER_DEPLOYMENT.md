# 🚀 Deploy n8n Discord Bot to Render

## 🔧 CRITICAL FIXES APPLIED (Dec 22, 2024)

### ✅ Port Configuration Fixed
- **Issue**: Mismatch between Dockerfile (3000) and render.yaml (10000) 
- **Fix**: Standardized to port 3000 across all configurations
- **Impact**: Eliminates port binding errors on Render

### ✅ Environment Validation Added
- **Issue**: Bot would start without DISCORD_TOKEN, causing silent failures
- **Fix**: Added startup validation with clear error messages
- **Impact**: Immediate feedback if token is missing

### ✅ Health Check Enhanced  
- **Issue**: Render health checks were failing intermittently
- **Fix**: Improved error handling and timeout configuration
- **Impact**: Better deployment reliability

### ⚠️ Discord API Error 50024 Mitigated
- **Issue**: Forum channel creation failing with API error
- **Status**: Fallback to text channels implemented
- **Impact**: Setup completes successfully even with forum issues

## ⚡ Quick Deploy (5 minutes)

### 1. Push Code to GitHub
```bash
# Initialize git repo (if not done)
git init
git add .
git commit -m "Initial Discord bot deployment"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/n8n-discord-bot.git
git push -u origin main
```

### 2. Deploy on Render
1. **Sign up**: Go to [render.com](https://render.com) and create free account
2. **Connect GitHub**: Link your GitHub account
3. **Create Web Service**: 
   - Click "New +" → "Web Service"
   - Connect repository: `YOUR_USERNAME/n8n-discord-bot`
   - Branch: `main`

### 3. Configure Service
```
Name: n8n-discord-bot
Environment: Node
Region: Oregon (free tier)
Branch: main
Build Command: npm install
Start Command: npm start
Plan: Free (750 hours/month)
```

### 4. Set Environment Variables
In Render dashboard → Environment tab:
```
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
NODE_ENV=production
TZ=UTC
PORT=10000
SPOTLIGHT_ENABLED=true
LOG_LEVEL=info
```

### 5. Deploy & Test
- Click "Create Web Service"
- Wait 2-3 minutes for deployment
- Check logs for "Bot logged in as..." message
- Your bot is now live 24/7!

## 🔧 Bot Invite & Setup

### Step 1: Get Bot Invite Link
Replace `YOUR_CLIENT_ID` with your bot's Client ID:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### Step 2: Invite to Discord Server
1. Use invite link above
2. Select your Discord server
3. Grant Administrator permissions
4. Click "Authorize"

### Step 3: Run Server Setup
In your Discord server, type:
```
/setup
```

This will automatically create:
- ✅ 9 categories with 23+ channels
- ✅ 4 roles with proper permissions
- ✅ Private VIP areas
- ✅ Weekly spotlight automation
- ✅ Interview management system

## 🎯 Features Enabled

### 🤖 Slash Commands
- `/setup` - Complete server setup (owner only)
- `/assign-role @user @role` - Assign roles
- `/remove-role @user @role` - Remove roles
- `/list-roles` - Show all roles
- `/interview start @candidate` - Create interview channel
- `/test-spotlight` - Test weekly spotlight
- `/spotlight-status` - Check spotlight status

### ⏰ Automation
- **Weekly Spotlights**: Every Monday 00:00 UTC
- **Auto Threads**: Discussion threads on spotlights
- **Pin Management**: Keeps 4 recent spotlights pinned
- **State Tracking**: Remembers setup progress

### 🔒 Permissions
- **Read-only channels**: Announcements, job board
- **Slowmode**: Anti-spam on busy channels
- **Private areas**: VIP and admin channels
- **Role-based access**: Verified Pro exclusive areas

## 📊 Monitoring

### Render Dashboard
- **Logs**: Real-time bot activity
- **Metrics**: CPU/Memory usage
- **Health**: Service status
- **Deploys**: Auto-deploy from GitHub

### Discord Activity
- Bot status: Online/Offline
- Command responses
- Weekly spotlight posts
- Error handling in action

## 🆓 Free Tier Limits
- **Render Free**: 750 hours/month (31 days)
- **Automatic Sleep**: After 15 min inactivity
- **Wake Time**: ~30 seconds on new activity
- **Storage**: Ephemeral (resets on deploy)

## 🔄 Updates & Maintenance

### Auto-Deploy Setup
1. Push changes to GitHub main branch
2. Render auto-deploys within 1-2 minutes
3. Bot restarts with new code
4. Zero manual intervention needed

### Manual Deploy
```bash
git add .
git commit -m "Update bot features"
git push origin main
```

## 🚨 Troubleshooting

### Bot Not Responding
1. Check Render logs for errors
2. Verify DISCORD_TOKEN is set
3. Ensure bot has Administrator permissions
4. Try `/ping` command first

### Commands Not Working
1. Bot needs Administrator permissions
2. Check if slash commands are registered
3. Wait 5 minutes after first deploy
4. Use `/setup` as server owner only

### Weekly Spotlight Issues
1. Check `#weekly-spotlight` channel exists
2. Verify bot can post in channel
3. Check Render logs at Monday 00:00 UTC
4. Use `/test-spotlight` to debug

## 💡 Pro Tips

1. **GitHub Integration**: Push changes → Auto-deploy
2. **Log Monitoring**: Watch Render logs during setup
3. **Test First**: Use `/test-spotlight` before production
4. **Backup Config**: Keep `blueprint.json` updated
5. **Role Order**: Bot role must be above managed roles

## 🎉 Success Checklist

- ✅ Bot deployed to Render
- ✅ Environment variables set
- ✅ Bot invited to Discord server
- ✅ `/setup` command completed
- ✅ Roles and channels created
- ✅ Weekly spotlight scheduled
- ✅ All commands working

Your n8n Discord community is now live and automated! 🚀
