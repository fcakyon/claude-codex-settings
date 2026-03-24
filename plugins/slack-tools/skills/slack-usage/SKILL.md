---
name: slack-usage
description: "Search, read, and interact with Slack messages using the Slack MCP tools. Covers message search, channel history, posting, threading, and formatting. Use when asked to 'search Slack', 'find messages about X', 'get channel history', 'post a message to Slack', 'look up a conversation', or 'find what someone said in Slack'."
---

# Slack Usage Best Practices

## Message Search vs Channel History

**Default to `mcp__slack__slack_search_messages`** for finding messages. It searches across all channels and is the right tool for most lookups.

Only use `mcp__slack__slack_get_channel_history` when the user explicitly asks for recent activity in a specific channel.

### Example: Finding Past Discussions

1. Search with relevant keywords via `mcp__slack__slack_search_messages`
2. Narrow results by channel, user, or date range if needed
3. Retrieve thread replies for full context on matching messages

### Example: Monitoring a Channel

1. Call `mcp__slack__slack_get_channel_history` for recent activity
2. Note message timestamps (`ts`) for threading replies
3. React or reply as appropriate

## Message Formatting

| Format | Syntax |
|--------|--------|
| User mention | `<@USER_ID>` |
| Channel link | `<#CHANNEL_ID>` |
| URL with text | `<https://example.com\|link text>` |
| Bold | `*text*` |
| Inline code | `` `code` `` |
| Code block | Triple backticks |

## Threading

- Use threads to keep channels readable
- Reply in-thread when responding to a specific message
- Use "Also send to channel" only for important updates
- Thread replies don't trigger channel notifications by default

## Token Types

| Token | Prefix | Scope |
|-------|--------|-------|
| Bot token | `xoxb-` | Acts as the bot; limited to channels bot is invited to |
| User token | `xoxp-` | Acts as the user; access to all user channels |

Search typically requires a **user token** for full workspace access. Posting works with either token type.

## Rate Limiting

Slack enforces rate limits (roughly 1 req/sec for most methods). For bulk operations:

1. Space out requests to stay within limits
2. Handle `429 Too Many Requests` responses with retry-after backoff
3. Cache results when repeated lookups are needed

<details>
<summary>Channel types reference</summary>

- **Public channels** - Visible to all workspace members
- **Private channels** - Invite-only
- **DMs** - Direct messages between two users
- **Group DMs** - Multi-person direct conversations

</details>

<details>
<summary>MCP limitations</summary>

- Rate limits apply to all operations
- Admin-level operations are not available
- File uploads have size limits

</details>
