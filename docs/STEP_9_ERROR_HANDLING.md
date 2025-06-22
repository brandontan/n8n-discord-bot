# Step 9: Error Handling & Idempotent Resync

This document outlines the implementation of comprehensive error handling, state tracking, and dry run functionality for the Discord bot setup process.

## Features Implemented

### 1. Comprehensive Error Handling

#### Try/Catch Wrapper
- All create/update operations are now wrapped in try/catch blocks
- Specific error handling for Discord API error codes
- Graceful degradation when operations fail

#### Error Code 50013 (Missing Permissions) Handling
When the bot encounters permission errors, it provides actionable hints:

```
⚠️ Missing Permissions (Code: 50013)
The bot lacks the necessary permissions to complete this action.

How to fix:
• Ensure the bot has 'Manage Roles' permission for role creation
• Ensure the bot has 'Manage Channels' permission for channel creation
• Check that the bot's role is positioned above the roles it needs to create
• Verify the bot has 'Administrator' permission or specific permissions for this server
• Ask a server administrator to review and update the bot's permissions
```

#### Supported Error Codes
- **50013**: Missing Permissions
- **50001**: Missing Access
- **50035**: Invalid Form Body
- **30013**: Maximum Guilds/Roles/Channels Reached
- **Unknown**: Generic error with fallback suggestions

### 2. Guild State Management (`guildState.json`)

#### Persistent State Tracking
The bot maintains a `guildState.json` file that tracks:

```json
{
  "guilds": {
    "GUILD_ID": {
      "guildName": "Server Name",
      "setupStatus": "completed",
      "roles": {
        "Role Name": {
          "id": "role_id",
          "status": "created",
          "timestamp": "2024-01-15T10:30:00.000Z"
        }
      },
      "channels": {
        "Channel Name": {
          "id": "channel_id", 
          "categoryId": "category_id",
          "status": "created",
          "timestamp": "2024-01-15T10:30:00.000Z"
        }
      },
      "categories": {
        "Category Name": {
          "id": "category_id",
          "status": "created", 
          "timestamp": "2024-01-15T10:30:00.000Z"
        }
      },
      "lastUpdate": "2024-01-15T10:30:00.000Z",
      "errors": [
        {
          "timestamp": "2024-01-15T10:30:00.000Z",
          "context": "Creating role: Role Name",
          "message": "Missing Permissions",
          "code": 50013,
          "stack": "..."
        }
      ]
    }
  }
}
```

#### Idempotent Operations
- Running `/setup` multiple times only creates missing items
- Existing roles/channels are skipped with status messages
- Failed items are retried on subsequent runs
- State is preserved across bot restarts

### 3. Dry Run Mode

#### Environment Variable Control
Set the `DRY_RUN` environment variable to enable dry run mode:

```bash
# Enable dry run mode
DRY_RUN=true npm start
DRY_RUN=1 npm start

# Normal mode (default)
npm start
```

#### Dry Run Behavior
- No actual Discord API calls are made
- All intended actions are logged to console
- Setup command shows what would be created
- Perfect for testing and validation

#### Example Dry Run Output
```
[DRY RUN] Setting up roles for guild: Test Server
[DRY RUN] Would create 3 roles:
[DRY RUN] - Pro Builder (color: #ff6b35)
[DRY RUN] - Verified Pro (color: #4caf50)
[DRY RUN] - Client (color: #2196f3)

[DRY RUN] Would create 2 categories and 5 channels:
[DRY RUN] - Category: 🔒 Client ↔ Talent (private: true)
[DRY RUN] - Channel: interview-setup (type: text, category: 🔒 Client ↔ Talent)
```

## Implementation Details

### GuildStateManager Class

#### Key Methods
- `getGuildState(guildId)`: Retrieve current state
- `updateGuildState(guildId, guildName, updates)`: Update state
- `markRoleState(guildId, guildName, roleName, roleId, status)`: Track role status
- `markChannelState(guildId, guildName, channelName, channelId, categoryId, status)`: Track channel status
- `markCategoryState(guildId, guildName, categoryName, categoryId, status)`: Track category status
- `recordError(guildId, guildName, error, context)`: Log errors
- `getMissingRoles(guildId, blueprintRoles)`: Get roles that need creation
- `getMissingChannels(guildId, blueprintChannels)`: Get channels that need creation
- `getMissingCategories(guildId, blueprintCategories)`: Get categories that need creation
- `getErrorHint(error)`: Get actionable error hints
- `isDryRun()`: Check if dry run mode is enabled
- `logDryRun(action, details)`: Log dry run actions

### Updated Manager Classes

#### RoleManager Updates
- Integrated `GuildStateManager` for state tracking
- Added comprehensive error handling with specific error code responses
- Implemented dry run support with detailed logging
- Only creates missing roles on subsequent runs

#### ChannelManager Updates  
- Integrated `GuildStateManager` for state tracking
- Added comprehensive error handling for categories and channels
- Implemented dry run support with detailed logging
- Only creates missing categories/channels on subsequent runs

### Enhanced Setup Command

#### New Features
- Real-time status updates during setup
- Detailed error reporting with actionable hints
- Grouped error display by error code
- Automatic message splitting for long responses
- Dry run mode indication in all messages

#### Error Response Format
When errors occur, users receive:
1. Clear identification of the error type
2. Specific items that failed
3. Actionable steps to resolve the issue
4. Reminder that `/setup` can be re-run to retry failed items

## Usage Examples

### Normal Setup
```
/setup
```
Creates all missing roles and channels, provides detailed status report.

### Dry Run Testing
```bash
# In terminal
DRY_RUN=true npm start

# Then in Discord
/setup
```
Shows what would be created without making changes.

### Error Recovery
1. Bot encounters permission error during setup
2. User receives actionable error message
3. Admin fixes bot permissions
4. User runs `/setup` again
5. Bot only attempts failed items

### State Inspection
Check `src/data/guildState.json` to see detailed setup state for all guilds.

## Testing

### Dry Run Test Script
```bash
# Test dry run functionality
node scripts/test-dry-run.js

# Test with dry run enabled
DRY_RUN=true node scripts/test-dry-run.js
```

### Error Simulation
The error handling can be tested by:
1. Removing bot permissions
2. Running setup command
3. Observing error messages and hints
4. Restoring permissions
5. Running setup again to see idempotent behavior

## Benefits

1. **Reliability**: Setup process is resilient to failures
2. **User Experience**: Clear error messages with actionable solutions
3. **Efficiency**: Only creates missing items, avoiding duplicates
4. **Testing**: Dry run mode allows safe testing of changes
5. **Debugging**: Comprehensive state tracking and error logging
6. **Automation**: Idempotent operations work well with automation tools

## File Structure

```
src/
├── modules/
│   ├── guildStateManager.js      # New state management module
│   ├── roleManager.js            # Updated with error handling
│   └── channelManager.js         # Updated with error handling
├── data/
│   └── guildState.json           # New persistent state file
└── index.js                      # Updated setup command

scripts/
└── test-dry-run.js               # Dry run testing script

docs/
└── STEP_9_ERROR_HANDLING.md      # This documentation
```
