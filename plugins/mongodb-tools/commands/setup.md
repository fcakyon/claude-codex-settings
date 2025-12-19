---
description: Configure MongoDB MCP connection
---

# MongoDB Tools Setup

**Source:** [mongodb-js/mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server)

Configure the MongoDB MCP server with your connection string.

## Step 1: Check Current Status

Read the MCP configuration from `${CLAUDE_PLUGIN_ROOT}/.mcp.json`.

Check if MongoDB is configured:

- If `mongodb.env.MDB_MCP_CONNECTION_STRING` contains `REPLACE_WITH_CONNECTION_STRING`, it needs configuration
- If it contains a value starting with `mongodb://` or `mongodb+srv://`, already configured

Report status:

- "MongoDB MCP is not configured - needs a connection string"
- OR "MongoDB MCP is already configured"

## Step 2: Show Setup Guide

Tell the user:

```
To configure MongoDB MCP, you need a connection string.

Formats:
- Atlas: mongodb+srv://username:password@cluster.mongodb.net/database
- Local: mongodb://localhost:27017/database

Get Atlas connection string:
1. Go to cloud.mongodb.com
2. Navigate to your cluster
3. Click "Connect" → "Drivers"
4. Copy connection string

Note: MCP runs in READ-ONLY mode.

Don't need MongoDB MCP? Disable it via /mcp command.
```

## Step 3: Ask for Connection String

Use AskUserQuestion:

- question: "Do you have your MongoDB connection string ready?"
- header: "MongoDB"
- options:
  - label: "Yes, I have it"
    description: "I have my MongoDB connection string ready to paste"
  - label: "No, skip for now"
    description: "I'll configure it later"

If user selects "No, skip for now":

- Tell them they can run `/mongodb-tools:setup` again when ready
- Remind them they can disable MongoDB MCP via `/mcp` if not needed
- Exit

If user selects "Yes" or provides connection string via "Other":

- If they provided connection string in "Other" response, use that
- Otherwise, ask them to paste the connection string

## Step 4: Validate Connection String

Validate the provided connection string:

- Must start with `mongodb://` or `mongodb+srv://`

If invalid:

- Show error: "Invalid connection string format. Must start with 'mongodb://' or 'mongodb+srv://'"
- Ask if they want to try again or skip

## Step 5: Update Configuration

1. Read current `${CLAUDE_PLUGIN_ROOT}/.mcp.json`
2. Create backup at `${CLAUDE_PLUGIN_ROOT}/.mcp.json.backup`
3. Update `mongodb.env.MDB_MCP_CONNECTION_STRING` value to the actual connection string
4. Write updated configuration back to `${CLAUDE_PLUGIN_ROOT}/.mcp.json`

## Step 6: Confirm Success

Tell the user:

```
MongoDB MCP configured successfully!

IMPORTANT: Restart Claude Code for changes to take effect.
- Exit Claude Code
- Run `claude` again

To verify after restart, run /mcp and check that 'mongodb' server is connected.
```

## Troubleshooting

If MongoDB MCP fails after configuration:

```
Common fixes:
1. Authentication failed - Add ?authSource=admin to connection string
2. Network timeout - Whitelist IP in Atlas Network Access settings
3. Wrong credentials - Verify username/password, special chars need URL encoding
4. SSL/TLS errors - For Atlas, ensure mongodb+srv:// is used
```
