---
name: setup
description: "Configure and troubleshoot the Tavily MCP integration for web search and content extraction, including API key setup, quota management, and connection issues. Use when encountering 'Tavily MCP error', 'Tavily API key invalid', 'web search not working', 'Tavily failed', or when setting up Tavily integration for the first time."
---

# Tavily Tools Setup

## Setup Workflow

1. Run `/tavily-tools:setup` to launch the configuration wizard
2. Enter your Tavily API key when prompted (format: `tvly-...`)
3. If you don't have a key, get one from [app.tavily.com](https://app.tavily.com)
4. Test the connection by running a simple `mcp__tavily__tavily_search` query

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| API key invalid | Wrong or expired key | Get a new key from app.tavily.com (format: `tvly-...`) |
| Quota exceeded | Hit monthly limit | Free tier allows 1,000 searches/month; upgrade or wait for reset |
| Connection failed | Config not loaded | Restart Claude Code after config changes |

## Disabling Tavily

If you don't need web search, disable via `/mcp` command to prevent errors.
