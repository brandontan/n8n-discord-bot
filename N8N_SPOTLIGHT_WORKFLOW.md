# 🔗 N8N Dynamic Spotlight Content Workflow

This workflow integrates with your Discord bot to provide dynamic, real-time content for weekly spotlights instead of static local data.

## 🎯 **WORKFLOW OVERVIEW**

The n8n workflow will:
1. **Receive webhook** from Discord bot every Monday at 00:00 UTC+8
2. **Fetch latest content** from multiple sources (community, blog, GitHub)
3. **Process and curate** the best content automatically
4. **Return formatted spotlight** data to Discord bot

---

## 📋 **N8N WORKFLOW NODES**

### **1. Webhook Trigger Node**
```json
{
  "webhook_url": "https://your-n8n-instance.com/webhook/spotlight-content",
  "method": "POST",
  "response_mode": "lastNode",
  "options": {
    "response_code": 200,
    "response_headers": {
      "Content-Type": "application/json"
    }
  }
}
```

### **2. Content Sources (HTTP Request Nodes)**

**A. Latest Community Posts**
```javascript
// HTTP Request Node Settings
URL: https://community.n8n.io/latest.json?limit=10
Method: GET
Headers: {
  "User-Agent": "n8n-discord-spotlight/1.0"
}
```

**B. Latest Blog Posts** 
```javascript
// HTTP Request Node Settings  
URL: https://n8n.io/blog/feed.xml
Method: GET
Headers: {
  "Accept": "application/rss+xml, application/xml"
}
```

**C. GitHub Latest Release**
```javascript
// HTTP Request Node Settings
URL: https://api.github.com/repos/n8n-io/n8n/releases/latest
Method: GET
Headers: {
  "Accept": "application/vnd.github.v3+json"
}
```

### **3. Content Processing (Function Nodes)**

**A. Community Posts Processor**
```javascript
// Process community posts
const posts = $json.topic_list.topics.slice(0, 5);
const processedPosts = posts.map(post => ({
  title: `💬 Community: ${post.title}`,
  description: `Trending discussion: ${post.title.substring(0, 100)}...`,
  link: `https://community.n8n.io/t/${post.slug}/${post.id}`,
  tags: ['Community', 'Discussion', 'Help'],
  type: 'community',
  score: post.posts_count + post.like_count,
  created: post.created_at
}));

return processedPosts;
```

**B. Blog Posts Processor**
```javascript
// Process blog RSS feed
const parser = require('xml2js').parseString;
const feed = $json;

parser(feed, (err, result) => {
  if (err) return [];
  
  const items = result.rss.channel[0].item.slice(0, 3);
  return items.map(item => ({
    title: `📝 Blog: ${item.title[0]}`,
    description: item.description[0].substring(0, 200) + '...',
    link: item.link[0],
    tags: ['Blog', 'Tutorial', 'News'],
    type: 'blog',
    score: 10, // Higher priority for blog posts
    created: item.pubDate[0]
  }));
});
```

**C. GitHub Release Processor**
```javascript
// Process GitHub releases
const release = $json;
if (release.tag_name) {
  return [{
    title: `🚀 New Release: n8n ${release.tag_name}`,
    description: release.body.substring(0, 200) + '...',
    link: release.html_url,
    tags: ['Release', 'Update', 'Features'],
    type: 'release',
    score: 15, // Highest priority
    created: release.published_at
  }];
}
return [];
```

### **4. Content Aggregation & Selection**
```javascript
// Merge all content sources
const allContent = [
  ...$('Community Posts').all(),
  ...$('Blog Posts').all(), 
  ...$('GitHub Release').all()
].flat();

// Filter recent content (last 7 days)
const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const recentContent = allContent.filter(item => 
  new Date(item.created) > oneWeekAgo
);

// Sort by score and recency
const sortedContent = recentContent.sort((a, b) => {
  const scoreA = a.score + (new Date(a.created).getTime() / 1000000);
  const scoreB = b.score + (new Date(b.created).getTime() / 1000000);
  return scoreB - scoreA;
});

// Select best content
const selectedContent = sortedContent[0] || {
  title: "🌟 Explore n8n Automation",
  description: "Discover the power of visual workflow automation with n8n",
  link: "https://n8n.io/workflows",
  tags: ["Automation", "Workflows", "n8n"],
  type: "fallback"
};

return {
  ...selectedContent,
  id: `auto-${Date.now()}`,
  thumbnail: "", // No external thumbnails to avoid 404s
  generated_at: new Date().toISOString(),
  source: "n8n-workflow"
};
```

### **5. Response Formatting**
```javascript
// Format final response for Discord bot
return {
  success: true,
  spotlight: $json,
  metadata: {
    generated_at: new Date().toISOString(),
    content_sources: ['community', 'blog', 'github'],
    selection_criteria: 'score_and_recency'
  }
};
```

---

## 🔧 **SETUP INSTRUCTIONS**

### **Step 1: Import Workflow**
1. Copy the JSON workflow (see attached file)
2. Import into your n8n instance
3. Activate the workflow

### **Step 2: Configure Webhook URL**
1. Copy your n8n webhook URL
2. Update Discord bot config:
```
/spotlight-config enable-n8n webhook-url:https://your-n8n-instance.com/webhook/spotlight-content
```

### **Step 3: Test Integration**
```
/test-spotlight
```

---

## 📊 **CONTENT PRIORITIZATION LOGIC**

**Scoring System:**
- **GitHub Releases**: 15 points (highest priority)
- **Blog Posts**: 10 points 
- **Community Posts**: posts_count + like_count
- **Recency Bonus**: +timestamp/1000000

**Selection Criteria:**
1. Content from last 7 days
2. Highest combined score
3. Fallback to default if no recent content

---

## 🔄 **WORKFLOW TRIGGERS**

**Automatic:**
- Discord bot calls webhook every Monday 00:00 UTC+8
- Workflow processes and returns fresh content

**Manual:**
- `/test-spotlight` command triggers immediate execution
- Admin can test content generation anytime

---

## 🛡️ **ERROR HANDLING**

**Timeout Protection:**
- Discord bot waits max 5 seconds for response
- Falls back to local content if webhook fails

**Content Validation:**
- Workflow validates all required fields
- Provides sensible defaults for missing data

**Source Failures:**
- If one source fails, others continue
- Graceful degradation to available sources

---

## 💡 **CUSTOMIZATION OPTIONS**

**Add New Sources:**
- Reddit n8n subreddit
- YouTube n8n channel
- Twitter n8n account
- Custom RSS feeds

**Content Filtering:**
- Keyword filtering
- Content type preferences
- Language detection
- Quality scoring

**Advanced Features:**
- AI content summarization
- Automatic tagging
- Duplicate detection
- A/B testing

---

This workflow transforms your Discord spotlight from static content to a dynamic, intelligent content curation system that always provides fresh, relevant automation insights to your community!
