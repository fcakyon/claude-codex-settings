---
name: setup
description: "Configure the Claude Code statusline to display session context usage, token costs, and 5-hour rate limit status. Supports native Anthropic API and ccusage modes. Use when asked to 'configure statusline', 'setup statusline', 'show context usage', 'display token count', '5H usage', 'time until reset', 'statusline colors', 'statusline not working', or to change the Claude Code status bar display."
---

# Statusline Setup

## Setup Workflow

1. Run `/statusline-tools:setup` to launch the configuration wizard
2. Choose a display mode:
   - **Native** - Session + 5H usage via Anthropic API, color-coded
   - **ccusage** - Session and daily stats, works with z.ai and third-party endpoints
   - **Disable** - Remove the statusline display entirely
3. Verify the statusline appears in your Claude Code session

## Native Statusline Display

Example output:

```
[Session] 45% $3 | [5H] 16% 3h52m
```

| Metric | Description |
|--------|-------------|
| Session % | Context window usage for the current session |
| Session cost | Running cost in USD |
| 5H % | Account-wide 5-hour usage percentage |
| Time to reset | Countdown until the 5H rate limit block resets |

### Color Coding

| Color | Usage threshold | Reset time threshold |
|-------|----------------|---------------------|
| Green | Below 50% | Less than 1h until reset |
| Yellow | 50-70% | 1-3.5h until reset |
| Red | Above 70% | More than 3.5h until reset |

**Note:** Native mode requires the Anthropic API. For z.ai or other third-party endpoints, use ccusage instead.

## Requirements

Native statusline depends on `jq` and `curl`:

- **macOS**: `brew install jq`
- **Ubuntu/Debian**: `sudo apt install jq`

## Reference

See the [Claude Code statusline docs](https://code.claude.com/docs/en/statusline) for full configuration details.
