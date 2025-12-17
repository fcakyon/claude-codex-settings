---
description: Configure Supabase MCP with OAuth authentication
---

# Supabase Tools Setup

Configure the official Supabase MCP server with OAuth.

## Step 1: Check Current Status

Read the MCP configuration from `${CLAUDE_PLUGIN_ROOT}/.mcp.json`.

Check if Supabase is configured:

- If `supabase.url` contains `REPLACE_WITH_PROJECT_REF`, it needs configuration
- If it contains an actual project reference, already configured

Report status:

- "Supabase MCP is not configured - needs project reference"
- OR "Supabase MCP is configured with project: PROJECT_REF"

## Step 2: Show Setup Guide

Tell the user:

```
To configure Supabase MCP, you need your Supabase project reference.

Quick steps:
1. Go to supabase.com/dashboard
2. Select your project
3. Go to Project Settings > General
4. Copy the "Reference ID" (looks like: abcdefghijklmnop)

The MCP uses OAuth - you'll authenticate via browser when first connecting.
```

## Step 3: Ask for Project Reference

Use AskUserQuestion:

- question: "Do you have your Supabase project reference ready?"
- header: "Project Ref"
- options:
  - label: "Yes, I have it"
    description: "I have my Supabase project reference ready"
  - label: "No, skip for now"
    description: "I'll configure it later"

If user selects "No, skip for now":

- Tell them they can run `/supabase-tools:setup` again when ready
- Remind them they can disable Supabase MCP via `/mcp` if not needed
- Exit

If user selects "Yes" or provides reference via "Other":

- If they provided reference in "Other" response, use that
- Otherwise, ask them to paste the project reference

## Step 4: Validate Reference

Validate the provided reference:

- Must be alphanumeric
- Should be 16-24 characters

If invalid:

- Show error: "Invalid project reference format"
- Ask if they want to try again or skip

## Step 5: Update Configuration

1. Read current `${CLAUDE_PLUGIN_ROOT}/.mcp.json`
2. Create backup at `${CLAUDE_PLUGIN_ROOT}/.mcp.json.backup`
3. Replace `REPLACE_WITH_PROJECT_REF` with the actual project reference in the URL
4. Write updated configuration back to `${CLAUDE_PLUGIN_ROOT}/.mcp.json`

## Step 6: Confirm Success

Tell the user:

```
Supabase MCP configured successfully!

IMPORTANT: Restart Claude Code for changes to take effect.
- Exit Claude Code
- Run `claude` again

On first use, you'll be prompted to authenticate via browser (OAuth).
To verify after restart, run /mcp and check that 'supabase' server is connected.
```
