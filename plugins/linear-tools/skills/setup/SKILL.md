---
name: setup
description: "Configure Linear MCP integration and troubleshoot connection errors. Walks through OAuth setup, token refresh, and workspace permissions. Use when the user encounters Linear auth failures, OAuth errors, MCP connection issues, unauthorized errors, or needs help setting up the Linear integration."
---

# Linear Tools Setup

## Getting Started

1. Run `/linear-tools:setup` to start the Linear MCP configuration
2. Complete the OAuth flow when prompted
3. Verify the connection is active

## Troubleshooting

| Error | Fix |
|-------|-----|
| **OAuth failed** | Re-authenticate via `/mcp` command |
| **Unauthorized** | Check Linear workspace permissions |
| **Token expired** | Re-run the OAuth flow |
| **MCP not responding** | Restart the MCP server and re-authenticate |

## Disabling Linear

If you don't need Linear, disable it via the `/mcp` command to prevent errors.
