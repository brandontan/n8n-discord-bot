# Weekly Spotlight Automation 🌟

The Weekly Spotlight automation is a feature that automatically posts curated content to your Discord server every Monday at 00:00 UTC. It showcases workflows, tutorials, community highlights, and features to keep your community engaged with fresh automation content.

## Features

### 🔄 Automated Posting
- **Schedule**: Every Monday at 00:00 UTC
- **Target Channel**: #weekly-spotlight
- **Content**: Rich embeds with titles, descriptions, links, and thumbnails
- **Discussion**: Automatically creates discussion threads
- **Pinning**: Manages pinned messages (keeps last 4 by default)

### 📊 Content Sources
1. **n8n Webhook Integration**: Fetch dynamic content from n8n workflows
2. **Google Sheets Integration**: Pull content from publicly accessible spreadsheets
3. **Local Spotlight Data**: Curated list of spotlights in `spotlight.json`
4. **Fallback Content**: Default message when all sources fail

### 🎯 Smart Features
- **Duplicate Prevention**: Tracks used spotlights to avoid repeats
- **Weekly Reset**: Resets used spotlight tracking on new week cycles
- **Error Handling**: Graceful fallbacks when external sources fail
- **Thread Management**: Creates discussion threads with 7-day auto-archive

## Setup

### 1. Channel Creation
Create a channel named `#weekly-spotlight` in your Discord server. The bot will automatically detect and use this channel for posting.

### 2. Basic Configuration
The spotlight automation starts automatically when the bot launches. No additional setup is required for basic functionality.

### 3. External Integrations (Optional)

#### n8n Webhook Integration
```bash
/spotlight-config enable-n8n webhook-url:https://your-n8n-instance.com/webhook/spotlight
```

**Expected n8n Response Format:**
```json
{
  \"title\": \"🚀 Automation Showcase: E-commerce Order Processing\",
  \"description\": \"Discover how to build a complete e-commerce order processing workflow...\",
  \"link\": \"https://n8n.io/workflows/ecommerce-order-processing\",
  \"thumbnail\": \"https://example.com/thumbnail.jpg\",
  \"tags\": [\"E-commerce\", \"Shopify\", \"Automation\"],
  \"type\": \"workflow\"
}
```

#### Google Sheets Integration
```bash
/spotlight-config enable-gsheets sheet-url:https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0
```

**Expected Google Sheets Format:**
| title | description | link | thumbnail | tags | type |
|-------|-------------|------|-----------|------|------|
| Tutorial: AI Workflows | Learn to build AI-powered automation | https://example.com | https://thumb.com | AI,Tutorial | tutorial |

**Important**: Make sure your Google Sheet is publicly accessible (\"Anyone with the link can view\").

## Commands

### For Moderators (Manage Messages Permission)

#### `/test-spotlight`
Manually trigger a test spotlight post to verify the automation is working.

#### `/spotlight-status`
Check the current status of the spotlight automation including:
- Automation status (running/stopped)
- Next scheduled run time
- Spotlights used in current cycle
- Current week number

### For Administrators

#### `/spotlight-config`
Configure spotlight automation settings:

- **`enable-n8n`**: Enable n8n webhook integration
- **`enable-gsheets`**: Enable Google Sheets integration  
- **`disable-external`**: Disable all external integrations
- **`set-max-pins`**: Set maximum pinned spotlight messages (1-10)
- **`view`**: View current configuration

#### `/spotlight-control`
Control the automation:

- **`start`**: Start the spotlight automation
- **`stop`**: Stop the spotlight automation
- **`restart`**: Restart the spotlight automation

## Content Management

### Local Spotlight Data
Edit `src/data/spotlight.json` to add or modify local spotlight content:

```json
{
  \"spotlights\": [
    {
      \"id\": \"unique-id\",
      \"title\": \"🚀 Your Spotlight Title\",
      \"description\": \"Engaging description of the content...\",
      \"link\": \"https://your-content-link.com\",
      \"thumbnail\": \"https://your-thumbnail-url.com/image.jpg\",
      \"tags\": [\"Tag1\", \"Tag2\", \"Tag3\"],
      \"type\": \"workflow\"
    }
  ],
  \"settings\": {
    \"fallback_message\": \"Your fallback message\",
    \"fallback_thumbnail\": \"https://fallback-image.com\",
    \"max_pinned_messages\": 4,
    \"enable_n8n_integration\": false,
    \"n8n_webhook_url\": \"\",
    \"enable_gsheets_integration\": false,
    \"gsheets_url\": \"\"
  }
}
```

### Content Types
- **workflow**: Automation workflows and templates
- **tutorial**: Step-by-step guides and learning content
- **community**: Community highlights and success stories
- **feature**: New feature announcements and updates
- **custom**: Any other type of content

## Automation Logic

### Content Selection Priority
1. **n8n Webhook** (if enabled and successful)
2. **Google Sheets** (if enabled and successful)
3. **Local Spotlight Data** (with duplicate prevention)
4. **Fallback Message** (if all else fails)

### Duplicate Prevention
- Tracks used spotlight IDs within a week cycle
- Resets tracking on new week (Monday)
- Ensures variety in content selection
- Falls back to allowing repeats if all content is exhausted

### Pin Management
- Automatically pins new spotlight messages
- Maintains maximum number of pinned spotlights (default: 4)
- Unpins oldest spotlight messages when limit exceeded
- Only manages pins for spotlight messages (identified by footer text)

## Technical Details

### Cron Schedule
```javascript
'0 0 * * 1' // Every Monday at 00:00 UTC
```

### Error Handling
- Graceful fallbacks for external API failures
- Comprehensive logging for debugging
- Continues operation even if individual features fail
- Validation and normalization of all content data

### Performance
- Efficient content caching and selection
- Minimal API calls to external services
- Asynchronous processing for Discord operations
- Smart memory management for used content tracking

## Troubleshooting

### Common Issues

**Spotlight not posting automatically:**
1. Check if automation is running: `/spotlight-status`
2. Verify #weekly-spotlight channel exists
3. Check bot permissions in the channel
4. Review console logs for errors

**External integrations not working:**
1. Verify webhook URLs are accessible
2. Check Google Sheets public accessibility
3. Validate response format from external sources
4. Test with `/test-spotlight` command

**No content variety:**
1. Add more entries to local spotlight data
2. Enable external integrations for dynamic content
3. Check if spotlight tracking needs reset
4. Verify content sources are providing different data

### Debug Commands
```bash
# Check automation status
/spotlight-status

# Test manual posting
/test-spotlight

# View current configuration
/spotlight-config view

# Restart automation
/spotlight-control restart
```

## Example Workflow

### Setting up n8n Integration

1. **Create n8n Workflow:**
   - Add webhook trigger node
   - Connect to your content database/CMS
   - Format response according to expected structure
   - Deploy workflow and get webhook URL

2. **Configure Discord Bot:**
   ```bash
   /spotlight-config enable-n8n webhook-url:https://your-n8n.com/webhook/spotlight
   ```

3. **Test Integration:**
   ```bash
   /test-spotlight
   ```

4. **Monitor:**
   ```bash
   /spotlight-status
   ```

### Content Curation Best Practices

1. **Variety**: Mix different content types (workflows, tutorials, community)
2. **Quality**: Ensure all links are working and content is valuable
3. **Freshness**: Regular updates to keep content current
4. **Engagement**: Use compelling titles and descriptions
5. **Visual Appeal**: Include quality thumbnails and images

## Support

For issues or feature requests related to Weekly Spotlight automation:

1. Check the troubleshooting section above
2. Review console logs for error messages
3. Test with manual commands to isolate issues
4. Verify external service availability and formats
5. Ensure proper Discord permissions for the bot

The Weekly Spotlight automation helps maintain an active and engaged community by consistently delivering valuable automation content. Configure it once and let it run automatically to keep your Discord server buzzing with fresh insights and learning opportunities! 🚀
