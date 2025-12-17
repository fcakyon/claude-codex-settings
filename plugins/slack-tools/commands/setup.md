---
description: Configure Slack MCP tokens
---

# Slack Tools Setup

**Source:** [ubie-oss/slack-mcp-server](https://github.com/ubie-oss/slack-mcp-server)

Check Slack MCP status and configure tokens if needed.

## Step 1: Test Current Setup

Try listing Slack channels using `mcp__slack__slack_list_channels`.

If successful: Tell user Slack is configured and working.

If fails with authentication error: Continue to Step 2.

## Step 2: Token Requirements

Tell the user:

```
Slack MCP requires 3 tokens:

1. Bot Token (xoxb-...) - From your Slack app
2. User Token (xoxp-...) - From your Slack app
3. GitHub PAT (ghp_...) - For npm package access

Get tokens from: https://api.slack.com/apps
Create a GitHub PAT at: https://github.com/settings/tokens
```

## Step 3: Edit Configuration

Guide user to edit the plugin's `.mcp.json` file:

1. Open `${CLAUDE_PLUGIN_ROOT}/.mcp.json`
2. Replace `REPLACE_WITH_GITHUB_PAT` with actual GitHub PAT
3. Replace `REPLACE_WITH_BOT_TOKEN` with actual bot token (xoxb-...)
4. Replace `REPLACE_WITH_USER_TOKEN` with actual user token (xoxp-...)
5. Save the file

## Step 4: Restart

Tell the user:

```
After saving .mcp.json:
1. Exit Claude Code
2. Run `claude` again

Changes take effect after restart.
```

## Troubleshooting

If Slack MCP fails:

```
Common fixes:
1. invalid_auth - Token expired or invalid, regenerate from api.slack.com
2. missing_scope - Re-install app with required OAuth scopes
3. Token format - Bot tokens start with xoxb-, user tokens with xoxp-
4. Channel not found - Ensure bot is invited to the channel
5. Rate limited - Wait and retry, reduce request frequency
```

## Alternative: Disable Plugin

If user doesn't need Slack integration:

```
To disable this plugin:
1. Run /mcp command
2. Find the slack server
3. Disable it

This prevents errors from unconfigured credentials.
```
