---
description: Configure Slack MCP tokens
---

# Slack Tools Setup

**Source:** [ubie-oss/slack-mcp-server](https://github.com/ubie-oss/slack-mcp-server)

Configure the Slack MCP server with your tokens.

## Step 1: Check Current Status

Read the MCP configuration from `${CLAUDE_PLUGIN_ROOT}/.mcp.json`.

Check if Slack is configured:

- If any of these contain placeholder values, it needs configuration:
  - `slack.env.GITHUB_TOKEN` contains `REPLACE_WITH_GITHUB_PAT`
  - `slack.env.SLACK_BOT_TOKEN` contains `REPLACE_WITH_BOT_TOKEN`
  - `slack.env.SLACK_USER_TOKEN` contains `REPLACE_WITH_USER_TOKEN`
- If all contain actual tokens (ghp\_, xoxb-, xoxp-), already configured

Report status:

- "Slack MCP is not configured - needs tokens"
- OR "Slack MCP is already configured"

## Step 2: Show Setup Guide

Tell the user:

```
To configure Slack MCP, you need 3 tokens:

1. GitHub PAT (ghp_...) - For npm package access
   Get it at: https://github.com/settings/tokens
   Required scope: read:packages

2. Bot Token (xoxb-...) - From your Slack app
3. User Token (xoxp-...) - From your Slack app
   Get both at: https://api.slack.com/apps
   Required scopes: channels:history, channels:read, chat:write, users:read

Don't need Slack MCP? Disable it via /mcp command.
```

## Step 3: Ask for GitHub PAT

Use AskUserQuestion:

- question: "Do you have your GitHub PAT ready?"
- header: "GitHub PAT"
- options:
  - label: "Yes, I have it"
    description: "I have my GitHub PAT ready to paste (starts with ghp\_)"
  - label: "No, skip for now"
    description: "I'll configure it later"

If user selects "No, skip for now":

- Tell them they can run `/slack-tools:setup` again when ready
- Remind them they can disable Slack MCP via `/mcp` if not needed
- Exit

If user selects "Yes" or provides token via "Other":

- If they provided token in "Other" response, use that
- Otherwise, ask them to paste the token

## Step 4: Ask for Bot Token

Use AskUserQuestion:

- question: "Do you have your Slack Bot Token ready?"
- header: "Bot Token"
- options:
  - label: "Yes, I have it"
    description: "I have my Slack bot token ready (starts with xoxb-)"
  - label: "No, skip for now"
    description: "I'll configure it later"

If user selects "No, skip for now":

- Tell them they can run `/slack-tools:setup` again when ready
- Exit

If user selects "Yes" or provides token via "Other":

- If they provided token in "Other" response, use that
- Otherwise, ask them to paste the token

## Step 5: Ask for User Token

Use AskUserQuestion:

- question: "Do you have your Slack User Token ready?"
- header: "User Token"
- options:
  - label: "Yes, I have it"
    description: "I have my Slack user token ready (starts with xoxp-)"
  - label: "No, skip for now"
    description: "I'll configure it later"

If user selects "No, skip for now":

- Tell them they can run `/slack-tools:setup` again when ready
- Exit

If user selects "Yes" or provides token via "Other":

- If they provided token in "Other" response, use that
- Otherwise, ask them to paste the token

## Step 6: Validate Tokens

Validate the provided tokens:

- GitHub PAT must start with `ghp_`
- Bot Token must start with `xoxb-`
- User Token must start with `xoxp-`

If any invalid:

- Show error with specific token that failed validation
- Ask if they want to try again or skip

## Step 7: Update Configuration

1. Read current `${CLAUDE_PLUGIN_ROOT}/.mcp.json`
2. Create backup at `${CLAUDE_PLUGIN_ROOT}/.mcp.json.backup`
3. Update these values:
   - `slack.env.GITHUB_TOKEN` to the GitHub PAT
   - `slack.env.SLACK_BOT_TOKEN` to the bot token
   - `slack.env.SLACK_USER_TOKEN` to the user token
4. Write updated configuration back to `${CLAUDE_PLUGIN_ROOT}/.mcp.json`

## Step 8: Confirm Success

Tell the user:

```
Slack MCP configured successfully!

IMPORTANT: Restart Claude Code for changes to take effect.
- Exit Claude Code
- Run `claude` again

To verify after restart, run /mcp and check that 'slack' server is connected.
```

## Troubleshooting

If Slack MCP fails after configuration:

```
Common fixes:
1. invalid_auth - Token expired or invalid, regenerate from api.slack.com
2. missing_scope - Re-install app with required OAuth scopes
3. Token format - Bot tokens start with xoxb-, user tokens with xoxp-
4. Channel not found - Ensure bot is invited to the channel
5. Rate limited - Wait and retry, reduce request frequency
```
