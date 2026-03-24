---
name: setup
description: "Configure MongoDB MCP integration and troubleshoot connection errors. Walks through connection string setup, authentication fixes, and network configuration. Use when the user encounters MongoDB connection failures, authentication errors, invalid connection strings, authSource errors, or needs help setting up the MongoDB integration."
---

# MongoDB Tools Setup

## Getting Started

1. Run `/mongodb-tools:setup` to start the MongoDB MCP configuration
2. Provide your connection string when prompted (format: `mongodb://` or `mongodb+srv://`)
3. Verify the connection is active

## Troubleshooting

| Error | Fix |
|-------|-----|
| **Authentication failed** | Add `?authSource=admin` to connection string |
| **Invalid connection string** | Use `mongodb://` or `mongodb+srv://` prefix |
| **Network timeout** | Whitelist your IP in Atlas Network Access |
| **MCP not responding** | Restart the MCP server and reconfigure |

### Example: Fixing authSource

```
# Before (fails)
mongodb+srv://user:pass@cluster.mongodb.net/mydb

# After (works)
mongodb+srv://user:pass@cluster.mongodb.net/mydb?authSource=admin
```

## Disabling MongoDB

If you don't need MongoDB, disable it via the `/mcp` command to prevent errors.
