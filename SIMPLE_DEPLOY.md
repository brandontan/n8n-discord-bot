# 🚀 Super Simple Deployment Guide (Non-Technical)

## 📋 What You Need (5 minutes to gather)

1. **GitHub Account** - Sign up at https://github.com if you don't have one
2. **Your Discord Bot Token** - From your Discord Developer Portal (the long text starting with "MTM...")
3. **Your Discord Bot Client ID** - Also from Discord Developer Portal (numbers only)

---

## 🎯 Step 1: Create GitHub Repository (EASY - Just clicking!)

1. **Click this link**: https://github.com/new
2. **Repository name**: Type `n8n-discord-bot`
3. **Make sure it's PUBLIC** (click the "Public" option)
4. **DON'T check any boxes** at the bottom
5. **Click the green "Create repository" button**

✅ **You'll see a page with commands - IGNORE THEM, I'll handle the code!**

---

## 🎯 Step 2: I'll Push the Code (AUTOMATIC)

**Nothing for you to do here - I'll run the commands!**

---

## 🎯 Step 3: Deploy on Render (EASY - Just clicking!)

1. **Click this link**: https://render.com
2. **Click "Get Started for Free"**
3. **Sign up with GitHub** (click the GitHub button)
4. **Authorize Render** to access your GitHub
5. **Click "New +" → "Web Service"**
6. **Find your repository**: Look for "n8n-discord-bot" and click "Connect"
7. **Fill in these settings**:
   ```
   Name: n8n-discord-bot
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```
8. **Click "Create Web Service"** (DON'T DEPLOY YET!)

---

## 🎯 Step 4: Add Your Bot Token (EASY - Copy & Paste!)

**Still in Render dashboard:**

1. **Click "Environment" tab** (on the left side)
2. **Click "Add Environment Variable"** 
3. **Add these one by one** (click "Add Environment Variable" for each):

```
Key: DISCORD_TOKEN
Value: [PASTE YOUR BOT TOKEN HERE - the long text starting with MTM...]

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

4. **Click "Save Changes"**
5. **NOW click "Deploy"** button

---

## 🎯 Step 5: Invite Bot to Discord (EASY - Just one link!)

1. **Take your Client ID** (the numbers from Discord Developer Portal)
2. **Replace YOUR_CLIENT_ID in this link** with your actual Client ID:
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
   ```
3. **Click the link** and invite bot to your Discord server
4. **Make sure Administrator is checked** 
5. **Click "Authorize"**

---

## 🎯 Step 6: Setup Your Server (SUPER EASY!)

**In your Discord server, just type:**
```
/setup
```

**That's it!** The bot will create everything automatically:
- ✅ 9 categories with 23+ channels
- ✅ 4 roles (Freelancer, Client, Verified Pro, Admin)  
- ✅ All permissions and settings
- ✅ Weekly spotlight automation
- ✅ Complete n8n marketplace community

---

## 🎉 YOU'RE DONE!

Your Discord bot will be:
- ✅ **Live 24/7** on Render
- ✅ **Posting weekly spotlights** every Monday
- ✅ **Managing your n8n community** automatically
- ✅ **FREE** (Render free tier)

## 🆘 Need Help?

If anything goes wrong:
1. **Check Render logs** - In Render dashboard, click "Logs" tab
2. **Look for error messages** - They'll tell you what's wrong
3. **Make sure your DISCORD_TOKEN is correct** - It should start with "MTM..."

## 📱 Quick Commands to Try

After setup, test these in Discord:
- `/assign-role @username @Freelancer` - Assign roles
- `/test-spotlight` - Test weekly spotlight
- `/interview start @candidate` - Create interview channel

**Your n8n Discord community is now LIVE!** 🚀
