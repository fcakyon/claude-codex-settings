---
name: setup
description: This skill should be used when user encounters "Azure MCP error", "Azure authentication failed", "az login required", "Azure CLI not found", or needs help configuring Azure MCP integration.
---

# Azure Tools Setup

Run `/azure-tools:setup` to configure Azure MCP.

## Quick Fixes

- **Authentication failed** - Run `az login` to authenticate
- **Azure CLI not found** - Install Azure CLI first
- **Permission denied** - Check Azure RBAC roles for your account
- **Node.js not found** - Install Node.js 20 LTS or later

## Don't Need Azure MCP?

Disable via `/mcp` command to prevent errors.
