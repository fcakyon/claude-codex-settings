---
name: setup
description: This skill should be used when user encounters "Slack MCP error", "invalid_auth", "missing_scope", "Slack not working", "Slack token invalid", "channel_not_found", or needs help configuring Slack integration.
---

# Slack Tools Setup

Run `/slack-tools:setup` to configure Slack MCP.

## Quick Fixes

- **invalid_auth** - Token expired, regenerate at api.slack.com
- **missing_scope** - Re-install Slack app with required scopes
- **channel_not_found** - Bot not invited to channel

## Don't Need Slack?

Disable via `/mcp` command to prevent errors.
