---
name: statusline-setup
description: This skill should be used when user asks to "configure statusline", "setup statusline", "show context usage", "display token count", "cache hit rate", "statusline colors", "statusline not working", or wants to change how the Claude Code status bar displays information.
---

# Statusline Setup

Run `/claude-tools:statusline-setup` to configure the Claude Code statusline.

## Options

- **Native (colored, with cache %)** - Anthropic API only, color-coded display
- **ccusage (session/daily stats)** - works with z.ai too
- **Disable** - Remove statusline display

## What Native Statusline Shows

`Model | Context: X% | Cache: Y% | $Z.ZZ`

Example: `Opus 4.5 | Context: 26% | Cache: 85% | $0.40`

**Displayed information:**

- Model name (e.g., Opus 4.5, Sonnet)
- Context window usage percentage with color coding
- Cache hit rate (prompt caching efficiency)
- Session cost in USD

**Color scheme:**

- Context % green when <50% (plenty of room)
- Context % yellow when 50-80% (getting full)
- Context % red when >80% (near autocompact at 95%)
- Labels and separators are dimmed for readability

**Note:** Native may not work with z.ai/third-party endpoints. Use ccusage for z.ai.

## Requirements

Native statusline requires `jq`. Install:

- macOS: `brew install jq`
- Ubuntu/Debian: `sudo apt install jq`

## Docs

[Claude Code statusline docs](https://code.claude.com/docs/en/statusline) for more details.
