---
name: setup
description: "Configure and troubleshoot Azure MCP integration for Claude Code. Use when the user encounters Azure MCP errors, Azure authentication failures, az login issues, missing Azure CLI, or needs to set up Azure MCP from scratch. Covers installation, authentication, and permission troubleshooting."
---

# Azure Tools Setup

## Getting Started

1. Run `/azure-tools:setup` to configure Azure MCP.
2. Authenticate with `az login` when prompted.
3. Verify the connection is working by listing a resource (e.g., storage accounts).

## Troubleshooting

| Error | Fix |
| ----- | --- |
| Authentication failed | Run `az login` to re-authenticate |
| Azure CLI not found | Install [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) first |
| Permission denied | Check Azure RBAC roles assigned to your account |
| Node.js not found | Install Node.js 20 LTS or later |

## Disabling Azure MCP

If you don't need Azure MCP, disable it via the `/mcp` command to prevent errors.
