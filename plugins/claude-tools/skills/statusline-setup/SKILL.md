---
name: statusline-setup
description: This skill should be used when user asks to "configure statusline", "setup statusline", "show context usage", "display token count", "statusline not working", or wants to change how the Claude Code status bar displays information.
---

# Statusline Setup

Run `/claude-tools:statusline-setup` to configure the Claude Code statusline.

## Options

- **Native (session context % and cost)** - Anthropic API only
- **ccusage (session/daily stats)** - works with z.ai too
- **Disable** - Remove statusline display

## What Native Statusline Shows

`[Model] Context% | $Cost`

- Model name (e.g., Opus, Sonnet)
- Session context window usage percentage
- Session cost in USD

**Note:** Native may not work with z.ai/third-party endpoints. Use ccusage for z.ai.

## Requirements

Native statusline requires `jq`. Install:

- macOS: `brew install jq`
- Ubuntu/Debian: `sudo apt install jq`
