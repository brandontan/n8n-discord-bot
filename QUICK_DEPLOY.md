# 🚀 QUICK DEPLOY: n8n Professional Network Discord Bot

## ⚡ **5-Minute Deployment to Render.com (FREE)**

### 1. Discord Setup (2 minutes)
1. Go to: https://discord.com/developers/applications
2. Create "n8n Professional Network" application
3. Add Bot → Copy token → Enable Member + Message Content intents
4. Generate invite URL: `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8590459904&scope=bot%20applications.commands`

### 2. GitHub Upload (1 minute)
```bash
# From this directory:
gh repo create n8n-discord-community --public --push
# OR manually: create GitHub repo and push this code
```

### 3. Render.com Deploy (2 minutes)
1. Go to: https://render.com (sign up with GitHub)
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Name**: `n8n-professional-network`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (sufficient for small communities)

5. Add Environment Variables:
   - `DISCORD_TOKEN`: (paste your bot token)
   - `TZ`: `UTC` (or your timezone)
   - `NODE_ENV`: `production`

6. Click "Create Web Service" → Wait 2-3 minutes for deployment

### 4. Invite Bot & Run Setup
1. Use your invite URL to add bot to your Discord server
2. In Discord, type: `/setup`
3. Bot will create all channels, roles, and setup your community!

---

## 🏆 **Alternative: Railway (Professional, $5/month)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway new n8n-professional-network
railway add

# Set environment variables
railway variables set DISCORD_TOKEN=your_token_here
railway variables set TZ=UTC
railway variables set NODE_ENV=production

# Deploy
railway up
```

---

## 🔧 **Self-Hosted VPS (Advanced)**

```bash
# On your server:
git clone your_github_repo
cd n8n-discord-community
npm install
npm install -g pm2

# Set environment
echo "DISCORD_TOKEN=your_token" > .env
echo "TZ=UTC" >> .env

# Start with PM2
pm2 start src/index.js --name n8n-professional-network
pm2 save
pm2 startup
```

---

## ✅ **Post-Deployment Checklist**

After deployment:
- [ ] Bot online in Discord server
- [ ] Run `/setup` command successfully
- [ ] Test `/assign-role` command
- [ ] Verify `/spotlight manual` works
- [ ] Check all channels created properly
- [ ] Test interview creation: `/interview start @user`

## 🎯 **Ready for Community Launch!**

Your n8n professional community Discord server is now live with:
- ✅ 25+ organized channels
- ✅ Professional role system
- ✅ Interview coordination
- ✅ Weekly spotlight automation
- ✅ Client-talent matching
- ✅ Automated onboarding

**Next**: Invite your first n8n professionals and start building your community! 🚀
