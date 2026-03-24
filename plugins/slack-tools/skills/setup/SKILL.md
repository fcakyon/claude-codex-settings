---
name: setup
description: "Configure and troubleshoot Slack MCP integration including token setup, scope management, and error resolution. Use when encountering 'Slack MCP error', 'invalid_auth', 'missing_scope', 'Slack not working', 'Slack token invalid', 'channel_not_found', or when setting up Slack integration for the first time."
---

# Slack Tools Setup

## Setup Workflow

1. Run `/slack-tools:setup` to start the Slack MCP configuration wizard
2. Follow the prompts to connect your Slack workspace
3. Verify the connection is working by listing available channels

## Troubleshooting Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `invalid_auth` | Token expired or revoked | Regenerate token at [api.slack.com](https://api.slack.com) |
| `missing_scope` | App lacks required permissions | Re-install Slack app with the required OAuth scopes |
| `channel_not_found` | Bot not a member of the channel | Invite the bot to the target channel with `/invite @botname` |
| `Slack token invalid` | Malformed or incorrect token | Re-run `/slack-tools:setup` to reconfigure credentials |

## Disabling Slack MCP

If Slack integration is not needed, disable it via the `/mcp` command to prevent connection errors from appearing.
