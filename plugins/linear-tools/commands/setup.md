---
description: Configure Linear OAuth authentication
---

# Linear Tools Setup

**Source:** [Linear MCP Docs](https://linear.app/docs/mcp)

Check Linear MCP status and configure OAuth if needed.

## Step 1: Test Current Setup

Try listing teams using `mcp__linear__list_teams`.

If successful: Tell user Linear is configured and working.

If fails with authentication error: Continue to Step 2.

## Step 2: OAuth Authentication

Linear uses OAuth - no API keys needed. Tell the user:

```
Linear MCP uses OAuth authentication.

To authenticate:
1. Run the /mcp command in Claude Code
2. Find the "linear" server in the list
3. Click "Authenticate" or similar option
4. A browser window will open
5. Sign in to Linear and authorize access
```

## Step 3: Complete OAuth Flow

After user clicks authenticate:

- Browser opens to Linear authorization page
- User signs in with their Linear account
- User approves the permission request
- Browser shows success message
- Claude Code receives the token automatically

## Step 4: Verify Setup

Try listing teams again using `mcp__linear__list_teams`.

If successful: Linear is now configured.

## Troubleshooting

If OAuth fails:

```
Common fixes:
1. Clear browser cookies for linear.app
2. Try a different browser
3. Disable browser extensions
4. Re-run /mcp and authenticate again
5. Restart Claude Code and try again
```

## Alternative: Disable Plugin

If user doesn't need Linear integration:

```
To disable this plugin:
1. Run /mcp command
2. Find the linear server
3. Disable it

This prevents errors from missing authentication.
```
