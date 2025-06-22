# n8n Discord Bot - Role Management

This document describes the role management system implemented for the n8n Discord Bot.

## Overview

The role management system automatically creates and manages Discord roles based on a predefined blueprint configuration. It handles role creation, hierarchy positioning, data persistence, and provides commands for role assignment.

## Features

### 1. Blueprint-Based Role Creation
- Reads role definitions from `src/config/blueprint.json`
- Creates roles with specified names, colors, and permissions
- Skips roles that already exist
- Maintains proper role hierarchy (positions below bot's role)

### 2. Data Persistence
- Stores created role IDs in `src/data/roleData.json`
- Tracks role creation dates and metadata
- Supports multiple guilds with separate data

### 3. Role Hierarchy Management
- Ensures all created roles are positioned below the bot's highest role
- Prevents permission conflicts
- Maintains proper Discord role hierarchy

### 4. Slash Commands

#### `/setup`
- **Permission**: Server Owner only
- **Description**: Sets up all roles defined in the blueprint
- **Features**:
  - Creates missing roles
  - Skips existing roles
  - Reports creation results
  - Initializes data storage

#### `/assign-role`
- **Permission**: Manage Roles
- **Description**: Assign workflow roles to users
- **Options**:
  - `user`: Target user to assign role to
  - `role`: Role to assign (from predefined choices)

#### `/remove-role`
- **Permission**: Manage Roles
- **Description**: Remove workflow roles from users
- **Options**:
  - `user`: Target user to remove role from
  - `role`: Role to remove (from predefined choices)

#### `/list-roles`
- **Permission**: Everyone
- **Description**: List all managed roles and their information
- **Shows**:
  - Role names and member counts
  - Colors and positions
  - Current status

#### `/sync-pro-builder`
- **Permission**: Manage Roles
- **Description**: Future automation for n8n Pro Builder tag detection
- **Status**: Placeholder for future implementation

## Blueprint Configuration

The `src/config/blueprint.json` file defines the roles to be created:

```json
{
  "roles": [
    {
      "name": "n8n Developer",
      "color": "#FF6D00",
      "mentionable": true,
      "description": "Users who can create and manage n8n workflows"
    },
    {
      "name": "Pro Builder",
      "color": "#FFD700",
      "mentionable": true,
      "description": "Advanced n8n users with Pro Builder privileges"
    },
    // ... more roles
  ]
}
```

## Data Storage

Role data is stored in `src/data/roleData.json`:

```json
{
  "guilds": {
    "guild_id": {
      "name": "Server Name",
      "roles": {
        "Role Name": {
          "id": "role_id",
          "position": 5,
          "color": "#FF6D00",
          "createdAt": "2024-06-22T..."
        }
      },
      "setupDate": "2024-06-22T..."
    }
  }
}
```

## Error Handling

- Graceful handling of missing permissions
- Rate limiting protection with delays
- Comprehensive error logging
- User-friendly error messages

## Future Enhancements

### Pro Builder Automation
The `assignProBuilderRole()` method in `RoleManager` is prepared for future integration with n8n's user system to automatically assign the "Pro Builder" role to users with the corresponding n8n Pro Builder tag.

### Implementation Plan:
1. Connect to n8n user database/API
2. Monitor user tag changes
3. Automatically assign/remove roles based on tags
4. Sync on bot startup and periodic intervals

## Technical Notes

- Uses Discord.js v14
- Requires `GuildMembers` intent for member management
- Implements proper role hierarchy management
- Thread-safe data operations with file locking
- Supports multiple Discord servers simultaneously

## Setup Instructions

1. Ensure the bot has "Manage Roles" permission
2. Run `/setup` command as server owner
3. Use role assignment commands to manage user roles
4. Monitor logs for any issues

## File Structure

```
src/
├── config/
│   └── blueprint.json          # Role definitions
├── data/
│   └── roleData.json          # Persistent role data
├── modules/
│   └── roleManager.js         # Core role management logic
├── commands/
│   └── roleCommands.js        # Command definitions
└── index.js                   # Main bot file with handlers
```
