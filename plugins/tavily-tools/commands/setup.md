---
description: Configure Tavily MCP server credentials
---

# Tavily Tools Setup

Configure the Tavily MCP server with your API key.

## Step 1: Check Current Status

Read the MCP configuration from `${CLAUDE_PLUGIN_ROOT}/.mcp.json`.

Check if Tavily is configured:

- If `tavily.env.TAVILY_API_KEY` contains `REPLACE_WITH_TAVILY_API_KEY`, it needs configuration
- If it contains a value starting with `tvly-`, already configured

Report status:

- "Tavily MCP is not configured - needs an API key"
- OR "Tavily MCP is already configured"

## Step 2: Show Setup Guide

Tell the user:

```
To configure Tavily MCP, you need a Tavily API key.

Quick steps:
1. Go to app.tavily.com and sign in
2. Navigate to API Keys
3. Create a new API key
4. Copy the key (starts with tvly-)

Free tier: 1,000 searches/month

Don't need Tavily MCP? Disable it via /mcp command.
```

## Step 3: Ask for Key

Use AskUserQuestion:

- question: "Do you have your Tavily API key ready?"
- header: "Tavily Key"
- options:
  - label: "Yes, I have it"
    description: "I have my Tavily API key ready to paste"
  - label: "No, skip for now"
    description: "I'll configure it later"

If user selects "No, skip for now":

- Tell them they can run `/tavily-tools:setup` again when ready
- Remind them they can disable Tavily MCP via `/mcp` if not needed
- Exit

If user selects "Yes" or provides key via "Other":

- If they provided key in "Other" response, use that
- Otherwise, ask them to paste the key

## Step 4: Validate Key

Validate the provided key:

- Must start with `tvly-`
- Must be at least 20 characters

If invalid:

- Show error: "Invalid key format. Tavily keys start with 'tvly-'"
- Ask if they want to try again or skip

## Step 5: Update Configuration

1. Read current `${CLAUDE_PLUGIN_ROOT}/.mcp.json`
2. Create backup at `${CLAUDE_PLUGIN_ROOT}/.mcp.json.backup`
3. Update `tavily.env.TAVILY_API_KEY` value to the actual key
4. Write updated configuration back to `${CLAUDE_PLUGIN_ROOT}/.mcp.json`

## Step 6: Confirm Success

Tell the user:

```
Tavily MCP configured successfully!

IMPORTANT: Restart Claude Code for changes to take effect.
- Exit Claude Code
- Run `claude` again

To verify after restart, run /mcp and check that 'tavily' server is connected.
```
