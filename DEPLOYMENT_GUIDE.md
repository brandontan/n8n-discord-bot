# Discord Community Server Deployment Guide

## 🚀 Render.com Deployment

### 1. Environment Variables (Required in Render Dashboard)
```
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
NODE_ENV=production
TZ=UTC
PORT=10000
LOG_LEVEL=info
```

### 2. Optional for Enhanced Features
```
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
```

### 3. Deployment Steps
1. Push code to GitHub
2. Connect Render to GitHub repo
3. Add environment variables in Render dashboard
4. Deploy service
5. Run `/setup-community` in Discord

### 4. Discord Server Setup
1. Enable Community features in Server Settings
2. Complete community setup wizard
3. Run bot commands to configure channels and roles

## 🎯 Community Features Available

- ✅ Forum channels with tags
- ✅ Server guide and onboarding
- ✅ Visual asset downloads (with Unsplash key)
- ✅ Auto-moderation configuration
- ✅ Welcome screen setup
- ✅ Advanced role management

Your n8n automation community will be professional and engaging!
