#!/bin/bash

# 🚀 n8n Discord Bot - Quick Deploy Script
# This script prepares and deploys the bot to GitHub for Render deployment

set -e

echo "🚀 Starting n8n Discord Bot Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${BLUE}📁 Initializing Git repository...${NC}"
    git init
fi

# Check if Discord token is in .env
if [ -f ".env" ]; then
    if grep -q "MTM4NjE4MTQ4MzQyNDc4MDM1OA" .env; then
        echo -e "${YELLOW}⚠️  WARNING: Real Discord token found in .env${NC}"
        echo -e "${YELLOW}   Make sure to set DISCORD_TOKEN in Render dashboard, not in code!${NC}"
    fi
fi

# Add all files
echo -e "${BLUE}📦 Adding files to Git...${NC}"
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo -e "${YELLOW}ℹ️  No changes to commit${NC}"
else
    echo -e "${BLUE}💾 Committing changes...${NC}"
    git commit -m "Deploy n8n Discord Bot to Render - $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Instructions for GitHub and Render
echo ""
echo -e "${GREEN}✅ Code prepared for deployment!${NC}"
echo ""
echo -e "${BLUE}📋 NEXT STEPS:${NC}"
echo ""
echo -e "${YELLOW}1. Push to GitHub:${NC}"
echo "   git remote add origin https://github.com/YOUR_USERNAME/n8n-discord-bot.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo -e "${YELLOW}2. Deploy on Render:${NC}"
echo "   • Go to https://render.com"
echo "   • Click 'New +' → 'Web Service'"
echo "   • Connect your GitHub repository"
echo "   • Use these settings:"
echo "     - Environment: Node"
echo "     - Build Command: npm install"
echo "     - Start Command: npm start"
echo "     - Plan: Free"
echo ""
echo -e "${YELLOW}3. Set Environment Variables in Render:${NC}"
echo "   DISCORD_TOKEN=your_actual_bot_token"
echo "   NODE_ENV=production"
echo "   TZ=UTC"
echo "   PORT=10000"
echo "   SPOTLIGHT_ENABLED=true"
echo "   LOG_LEVEL=info"
echo ""
echo -e "${YELLOW}4. After deployment, invite bot to Discord:${NC}"
echo "   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands"
echo ""
echo -e "${YELLOW}5. Run setup command in Discord:${NC}"
echo "   /setup"
echo ""
echo -e "${GREEN}🎉 Your n8n Discord community will be live 24/7!${NC}"
