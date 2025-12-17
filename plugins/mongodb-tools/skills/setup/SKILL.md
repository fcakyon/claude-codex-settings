---
name: setup
description: This skill should be used when user encounters "MongoDB connection failed", "authentication failed", "MongoDB MCP error", "connection string invalid", "authSource error", or needs help configuring MongoDB integration.
---

# MongoDB Tools Setup

Run `/mongodb-tools:setup` to configure MongoDB MCP.

## Quick Fixes

- **Authentication failed** - Add `?authSource=admin` to connection string
- **Invalid connection string** - Use `mongodb://` or `mongodb+srv://` prefix
- **Network timeout** - Whitelist IP in Atlas Network Access

## Don't Need MongoDB?

Disable via `/mcp` command to prevent errors.
