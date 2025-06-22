# Deployment Guide

This guide provides detailed instructions for deploying the n8n Discord Builder Bot across different platforms and environments.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 16.9.0+
- npm or yarn
- Discord bot token

### Setup Steps
```bash
# 1. Clone and install
git clone <repository-url>
cd n8n-discord-builder
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Discord token

# 3. Run the bot
node src/index.js
```

## 🌐 Production Deployments

### Option 1: VPS with PM2 (Recommended)

**Requirements:**
- Ubuntu/Debian/CentOS server
- Node.js 16.9.0+
- PM2 process manager

**Setup Commands:**
```bash
# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Clone and setup project
git clone <repository-url>
cd n8n-discord-builder
npm install --production

# Create production environment file
nano .env
# Add your DISCORD_TOKEN and TZ

# Start with PM2
pm2 start src/index.js --name "n8n-discord-bot"
pm2 save
pm2 startup

# Monitor logs
pm2 logs n8n-discord-bot
pm2 monit
```

**PM2 Configuration File (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'n8n-discord-bot',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      TZ: 'UTC'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Option 2: Render.com (Free Tier Available)

**Steps:**
1. Push your code to GitHub
2. Sign up at [Render.com](https://render.com)
3. Create new "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Environment Variables:**
     - `DISCORD_TOKEN`: Your bot token
     - `TZ`: Your timezone (e.g., "UTC")

**render.yaml (optional):**
```yaml
services:
  - type: web
    name: n8n-discord-bot
    env: node
    buildCommand: npm install
    startCommand: node src/index.js
    envVars:
      - key: DISCORD_TOKEN
        sync: false
      - key: TZ
        value: UTC
```

### Option 3: Railway

**Steps:**
1. Visit [Railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables:
   - `DISCORD_TOKEN`: Your bot token
   - `TZ`: Your timezone
5. Deploy automatically starts

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node src/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Option 4: Heroku

**Requirements:**
- Heroku CLI installed
- Git repository

**Steps:**
```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-bot-name

# Set environment variables
heroku config:set DISCORD_TOKEN=your_token_here
heroku config:set TZ=UTC

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

**Procfile:**
```
worker: node src/index.js
```

**package.json scripts:**
```json
{
  "scripts": {
    "start": "node src/index.js",
    "heroku-postbuild": "npm install --production"
  }
}
```

### Option 5: DigitalOcean App Platform

**Steps:**
1. Create DigitalOcean account
2. Go to App Platform
3. Create new app from GitHub
4. Configure:
   - **Source:** Your GitHub repository
   - **Branch:** main/master
   - **Build Command:** `npm install`
   - **Run Command:** `node src/index.js`
5. Add environment variables
6. Deploy

**.do/app.yaml:**
```yaml
name: n8n-discord-bot
services:
- name: bot
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: node src/index.js
  build_command: npm install
  http_port: 8080
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DISCORD_TOKEN
    scope: RUN_TIME
    type: SECRET
  - key: TZ
    value: UTC
    scope: RUN_TIME
```

### Option 6: Docker

**Dockerfile:**
```dockerfile
FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001
USER botuser

# Expose port (optional, for health checks)
EXPOSE 3000

# Start the bot
CMD ["node", "src/index.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  discord-bot:
    build: .
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - TZ=UTC
    restart: unless-stopped
    volumes:
      - ./src/data:/usr/src/app/src/data
```

**Commands:**
```bash
# Build and run
docker build -t n8n-discord-bot .
docker run -e DISCORD_TOKEN=your_token -e TZ=UTC n8n-discord-bot

# With docker-compose
docker-compose up -d
docker-compose logs -f
```

### Option 7: Glitch

**Steps:**
1. Go to [Glitch.com](https://glitch.com)
2. Click "New Project" → "Import from GitHub"
3. Enter your repository URL
4. Create `.env` file with:
   ```
   DISCORD_TOKEN=your_token_here
   TZ=UTC
   ```
5. Your bot will start automatically

**glitch.json:**
```json
{
  "install": "npm install",
  "start": "node src/index.js",
  "watch": {
    "ignore": [
      "\\.git",
      "node_modules",
      "src/data"
    ],
    "install": {
      "include": [
        "^package\\.json$",
        "^package-lock\\.json$"
      ]
    },
    "restart": {
      "include": [
        "^src/"
      ]
    }
  }
}
```

## 🔧 Environment Variables

### Required Variables
```bash
# Essential
DISCORD_TOKEN=your_discord_bot_token

# Optional but recommended
TZ=UTC                    # Timezone for spotlight automation
NODE_ENV=production       # Production environment
DRY_RUN=false            # Set to true for testing

# Advanced (optional)
MAX_SETUP_RETRIES=3      # Maximum setup retry attempts
SPOTLIGHT_ENABLED=true   # Enable/disable spotlight automation
LOG_LEVEL=info           # Logging level (error, warn, info, debug)
```

### Platform-Specific Variables

**Heroku:**
```bash
heroku config:set DISCORD_TOKEN=your_token
heroku config:set TZ=UTC
heroku config:set NODE_ENV=production
```

**Railway:**
```bash
# Set in Railway dashboard under Variables tab
DISCORD_TOKEN=your_token
TZ=UTC
```

**Render:**
```bash
# Set in Render dashboard under Environment
DISCORD_TOKEN=your_token
TZ=UTC
```

## 📊 Monitoring & Maintenance

### Health Checks

Add this to your main index.js for HTTP health checks:
```javascript
const http = require('http');

// Simple health check server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});
```

### Logging Setup

**For PM2:**
```bash
# Create logs directory
mkdir logs

# View logs
pm2 logs n8n-discord-bot --lines 100
pm2 flush  # Clear logs
```

**For Docker:**
```bash
# View container logs
docker logs container_name -f --tail 100

# With docker-compose
docker-compose logs -f bot
```

### Backup & Recovery

**Important files to backup:**
- `src/data/` directory (contains bot state)
- `.env` file (environment configuration)
- `src/config/blueprint.json` (server blueprint)

**Backup script:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$DATE"

mkdir -p $BACKUP_DIR
cp -r src/data $BACKUP_DIR/
cp .env $BACKUP_DIR/
cp src/config/blueprint.json $BACKUP_DIR/

echo "Backup created: $BACKUP_DIR"
```

### Automatic Updates

**GitHub Actions workflow (.github/workflows/deploy.yml):**
```yaml
name: Deploy Bot
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm install
        
      - name: Test bot
        run: npm test
        env:
          DRY_RUN: true
          
      - name: Deploy to production
        # Add your deployment steps here
        run: echo "Deploy to your platform"
```

## 🚨 Troubleshooting

### Common Issues

**Bot won't start:**
```bash
# Check token validity
node -e "console.log(process.env.DISCORD_TOKEN?.length)"

# Check dependencies
npm install
npm audit fix
```

**Permission errors:**
```bash
# Fix file permissions
chmod +x src/index.js
chown -R $USER:$USER .
```

**Memory issues:**
```bash
# Check memory usage
free -h
ps aux | grep node

# For PM2
pm2 restart n8n-discord-bot --max-memory-restart 1G
```

**Port conflicts:**
```bash
# Check port usage
netstat -tulpn | grep :3000
lsof -i :3000

# Change port
export PORT=8080
```

### Platform-Specific Issues

**Render.com:**
- Build fails: Check Node.js version in package.json engines
- Timeout: Increase health check timeout in dashboard

**Heroku:**
- Slug size too large: Add `.slugignore` file
- Memory quota: Upgrade dyno or optimize memory usage

**Railway:**
- Build timeout: Split build into smaller steps
- Environment variables not loading: Restart service

**Docker:**
- Container exits: Check logs with `docker logs container_name`
- Permission denied: Use non-root user in Dockerfile

## 📈 Scaling Considerations

### Single Instance (Recommended)
- Most Discord bots don't need multiple instances
- Bot maintains state in local files
- Simpler deployment and monitoring

### Multiple Instances (Advanced)
If you need to scale:
- Implement shared database (PostgreSQL, MongoDB)
- Use Redis for caching and state
- Add load balancer with sticky sessions
- Consider sharding for large servers

### Resource Requirements

**Minimum:**
- RAM: 256MB
- CPU: 0.1 vCPU
- Storage: 1GB

**Recommended:**
- RAM: 512MB-1GB  
- CPU: 0.5 vCPU
- Storage: 5GB
- Network: 1TB/month

## 🔐 Security Best Practices

### Token Management
- Never commit tokens to version control
- Use environment variables or secrets management
- Rotate tokens regularly
- Use least-privilege permissions

### Server Security
- Keep dependencies updated
- Use HTTPS for webhooks
- Implement rate limiting
- Monitor for suspicious activity

### Deployment Security
- Use secrets management (Vault, AWS Secrets, etc.)
- Enable 2FA on hosting accounts
- Regular security audits
- Backup encryption

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review error logs carefully
3. Test locally with same environment
4. Contact platform support if needed

Common support resources:
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Heroku Documentation](https://devcenter.heroku.com)
- [DigitalOcean Documentation](https://docs.digitalocean.com)
