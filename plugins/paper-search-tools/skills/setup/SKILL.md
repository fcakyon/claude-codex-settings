---
name: setup
description: "Configure and troubleshoot the Paper Search MCP integration, including Docker installation and connection issues. Use when the user encounters paper-search MCP errors, Docker not found, Docker not running, paper search not working, or needs help setting up paper search."
---

# Paper Search Tools Setup

## Initial Setup

1. Run `/paper-search-tools:setup` to configure Paper Search MCP.
2. Verify Docker is installed and running — the paper search tools require Docker as a runtime dependency.
3. Restart Claude Code after Docker starts to establish the MCP connection.

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Docker not found` | Docker is not installed | Install Docker Desktop from https://docker.com and run `/paper-search-tools:setup` again |
| `Docker not running` | Docker daemon is stopped | Open Docker Desktop or run `docker info` to verify, then restart Claude Code |
| `Connection failed` | MCP server not connected | Restart Claude Code after confirming Docker is running |
| `paper-search MCP error` | General connection issue | Run `/paper-search-tools:setup` to reconfigure |

## Disabling Paper Search

If you don't need paper search, disable it via the `/mcp` command to prevent errors from the inactive MCP server.
