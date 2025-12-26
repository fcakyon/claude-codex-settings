---
name: setup
description: This skill should be used when user asks to "configure statusline", "setup statusline", "show context usage", "display token count", "5H usage", "time until reset", "statusline colors", "statusline not working", or wants to change how the Claude Code status bar displays information.
---

# Statusline Setup

Run `/statusline-tools:setup` to configure the Claude Code statusline.

## Options

- **Native (session + 5H usage)** - Anthropic API only, color-coded display
- **ccusage (session/daily stats)** - Works with z.ai too
- **Disable** - Remove statusline display

## What Native Statusline Shows

`[Session] 45% $3 | [5H] 16% 3h52m`

**Displayed information:**

- Session context window usage percentage
- Session cost in USD
- Account-wide 5-hour usage percentage
- Time until 5H block resets

**Color scheme:**

- 🟢 <50% usage or <1h until reset
- 🟡 50-70% usage or 1-3.5h until reset
- 🔴 70%+ usage or >3.5h until reset

**Note:** Native may not work with z.ai/third-party endpoints. Use ccusage for z.ai.

## Requirements

Native statusline requires `jq` and `curl`. Install:

- macOS: `brew install jq`
- Ubuntu/Debian: `sudo apt install jq`

## Docs

[Claude Code statusline docs](https://code.claude.com/docs/en/statusline) for more details.
