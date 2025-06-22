# 🚀 UPDATED RENDER DEPLOYMENT GUIDE

## ✅ WHAT I'VE ALREADY DONE:
- ✅ **GitHub Repository**: https://github.com/brandontan/n8n-discord-bot
- ✅ **All Code Pushed**: Complete bot ready to deploy
- ✅ **Repository Connected**: You should see "brandontan/n8n-discord-bot" in the dropdown

---

## 📋 EXACT STEPS FOR THE RENDER INTERFACE YOU'RE SEEING:

### **Fill in these fields exactly as shown:**

**1. Source Code** ✅
- Should already show: `brandontan/n8n-discord-bot - no.ver`

**2. Name**
```
n8n-discord-bot
```

**3. Project (Optional)**
- Leave blank or create new project

**4. Language**
- Select: **Node**

**5. Branch** 
- Select: **main**

**6. Region**
- Select: **Oregon (US West)**

**7. Root Directory (Optional)**
- Leave blank

**8. Instance Type**
- Select: **Free** ($0/month - 512 MB RAM, 0.1 CPU)

---

## 🔧 ENVIRONMENT VARIABLES SECTION

**Scroll down to "Environment Variables" and click "Add Environment Variable" for each:**

```
Key: DISCORD_TOKEN
Value: YOUR_BOT_TOKEN_HERE

Key: NODE_ENV
Value: production

Key: TZ
Value: UTC

Key: PORT
Value: 10000

Key: SPOTLIGHT_ENABLED
Value: true

Key: LOG_LEVEL
Value: info
```

---

## ⚙️ ADVANCED SETTINGS (Leave these as default)

**Build Command**: Should auto-detect as `npm install`
**Start Command**: Should auto-detect as `npm start`

**Everything else**: Leave as default

---

## 🚀 DEPLOY YOUR BOT

**At the bottom, click: "Deploy Web Service"**

**What happens next:**
1. ⏳ **Build starts** (2-3 minutes)
2. 📦 **Dependencies install** 
3. 🤖 **Bot starts up**
4. ✅ **Shows "Live" status**

**Look for this in logs:**
```
Bot logged in as n8n Server Builder#9713!
Weekly Spotlight: Cron job started
Health check server running on port 10000
```

---

## 🤖 INVITE BOT TO DISCORD

**Once deployed, get your Discord Bot Client ID and use this link:**

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

**Replace YOUR_CLIENT_ID with your actual Client ID (numbers only)**

---

## 🏗️ SETUP YOUR SERVER

**In Discord, type:**
```
/setup
```

**The bot will create:**
- 📁 9 categories 
- 💬 23+ channels
- 👥 4 roles
- 🔒 Permissions
- 📅 Weekly automation

---

## 📊 MONITOR DEPLOYMENT

**In Render dashboard:**
- **Logs tab**: See bot activity
- **Metrics tab**: Performance 
- **Settings tab**: Change config

**Bot should show "Online" in Discord within 5 minutes!**

---

## 🆘 TROUBLESHOOTING

**If deployment fails:**
1. **Check Environment Variables** - DISCORD_TOKEN must be set
2. **Check Logs** - Look for error messages
3. **Verify Free Tier** - Make sure you selected Free plan
4. **Region** - Oregon (US West) works best for free tier

**If bot doesn't respond:**
1. **Check bot is Online** in Discord
2. **Verify Administrator permissions** when inviting
3. **Wait 5 minutes** for slash commands to register
4. **Try `/ping`** first to test connectivity

---

## 🎉 SUCCESS!

**Your Discord bot will:**
- ✅ Run 24/7 on Render free tier
- ✅ Auto-post weekly spotlights (Mondays 00:00 UTC)
- ✅ Manage your n8n professional community
- ✅ Auto-update when I push improvements

**Repository**: https://github.com/brandontan/n8n-discord-bot
