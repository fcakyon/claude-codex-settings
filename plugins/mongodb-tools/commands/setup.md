---
description: Configure MongoDB MCP connection
---

# MongoDB Tools Setup

**Source:** [mongodb-js/mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server)

Check MongoDB MCP status and configure connection if needed.

## Step 1: Test Current Setup

Try listing databases using `mcp__mongodb__list_databases`.

If successful: Tell user MongoDB is configured and working.

If fails with connection error: Continue to Step 2.

## Step 2: Connection String Format

Tell the user:

```
MongoDB MCP requires a connection string.

Formats:
- Atlas: mongodb+srv://username:password@cluster.mongodb.net/database
- Local: mongodb://localhost:27017/database
- Replica Set: mongodb://host1,host2,host3/database?replicaSet=rs0

Get Atlas connection string from: https://cloud.mongodb.com
  1. Go to your cluster
  2. Click "Connect"
  3. Choose "Drivers"
  4. Copy connection string

Note: MCP runs in READ-ONLY mode.
```

## Step 3: Edit Configuration

Guide user to edit the plugin's `.mcp.json` file:

1. Open `${CLAUDE_PLUGIN_ROOT}/.mcp.json`
2. Replace `REPLACE_WITH_CONNECTION_STRING` with actual MongoDB URI
3. Save the file

## Step 4: Restart

Tell the user:

```
After saving .mcp.json:
1. Exit Claude Code
2. Run `claude` again

Changes take effect after restart.
```

## Troubleshooting

If MongoDB MCP fails:

```
Common fixes:
1. Authentication failed - Add ?authSource=admin to connection string
2. Invalid connection string - Check mongodb:// or mongodb+srv:// prefix
3. Network timeout - Whitelist IP in Atlas Network Access settings
4. Wrong credentials - Verify username/password, special chars need URL encoding
5. SSL/TLS errors - For Atlas, ensure mongodb+srv:// is used
```

## Alternative: Disable Plugin

If user doesn't need MongoDB integration:

```
To disable this plugin:
1. Run /mcp command
2. Find the mongodb server
3. Disable it

This prevents errors from unconfigured credentials.
```
