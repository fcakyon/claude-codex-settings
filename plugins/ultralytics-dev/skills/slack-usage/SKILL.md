---
name: slack-usage
description: This skill should be used when user asks to "search Slack for messages", "find Slack messages about X", "get channel history", "look up conversation in Slack", or "find what someone said in Slack".
---

# Slack MCP Usage

Use the Slack MCP server to integrate Slack message search and channel access into workflows.

## Critical Rules

**Always use `mcp__slack__slack_search_messages` first for all message searches.** Only use `mcp__slack__slack_get_channel_history` when explicitly asked for channel history.

This pattern prioritizes the more efficient search interface and prevents unnecessary full channel scans.

## Search Messages (Recommended)

Use `mcp__slack__slack_search_messages` for finding specific messages:

```
Query: Find messages about deployment status
Tool: mcp__slack__slack_search_messages
Parameters: query="deployment status"
```

**Best for:**

- Keyword searches
- Finding messages from specific users
- Searching across channels
- Time-bounded queries

## Channel History (When Needed)

Use `mcp__slack__slack_get_channel_history` only when user explicitly requests:

- "Get recent messages from #engineering"
- "Show me the channel history"
- "List all messages in this channel"

**Note:** This scans entire channel, so use sparingly.

## Integration Pattern

In commands and agents:

1. Check if user wants search or history
2. Default to `mcp__slack__slack_search_messages` for keywords
3. Use `mcp__slack__slack_get_channel_history` only if explicitly requested
4. Format results clearly with message content and metadata

## Environment Variables

Slack MCP requires:

- `SLACK_BOT_TOKEN` - Bot user token (xoxb-...)
- `SLACK_USER_TOKEN` - User token (xoxp-...)

Configure in shell before using the plugin.
