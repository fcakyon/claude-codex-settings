---
description: Configure Claude Code status line
---

# Statusline Setup

Configure the Claude Code status line to display context usage, cache hit rate, cost, and model information with color-coded indicators.

## Step 1: Check Current Status

Read `~/.claude/settings.json` and check if `statusLine` is configured:

- If `statusLine` exists, show current command
- If not configured, note that statusline is disabled

Report status:

- "Statusline is configured with: [command]"
- OR "Statusline is not configured"

## Step 2: Show Options

Tell the user:

```
Statusline displays real-time info at the bottom of Claude Code.

Options:
1. Native - Uses Claude Code's built-in JSON data
   - Shows: Model | Context: X% | Cache: Y% | $Z.ZZ
   - Color-coded context % (green <50%, yellow 50-80%, red >80%)
   - Cache hit rate shows prompt caching efficiency
   - Best for: Anthropic API users
   - Note: May not work with z.ai/third-party endpoints

2. ccusage - Third-party tool with more features
   - Shows: Context%, cost (session, daily)
   - Works with: Anthropic and z.ai endpoints
   - Reads Claude Code logs for tracking

3. Disable - Remove statusline
```

## Step 3: Ask for Choice

Use AskUserQuestion:

- question: "Which statusline configuration do you want?"
- header: "Statusline"
- options:
  - label: "Native (colored, with cache %)"
    description: "Anthropic API only - shows context/cache/cost with colors"
  - label: "ccusage (session/daily)"
    description: "Works with z.ai too - reads Claude Code logs"
  - label: "Disable"
    description: "Remove statusline display"

## Step 4: Apply Configuration

### If Native:

1. Create `~/.claude/statusline.sh`:

```bash
#!/bin/bash
input=$(cat)
MODEL=$(echo "$input" | jq -r '.model.display_name')
CONTEXT_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
USAGE=$(echo "$input" | jq '.context_window.current_usage // null')
COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')

# Colors
RESET='\033[0m'
WHITE='\033[97m'
DIM='\033[2m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'

if [ "$USAGE" != "null" ] && [ "$CONTEXT_SIZE" != "null" ]; then
  INPUT_TOKENS=$(echo "$USAGE" | jq '.input_tokens // 0')
  CACHE_CREATE=$(echo "$USAGE" | jq '.cache_creation_input_tokens // 0')
  CACHE_READ=$(echo "$USAGE" | jq '.cache_read_input_tokens // 0')
  CURRENT=$((INPUT_TOKENS + CACHE_CREATE + CACHE_READ))
  PERCENT=$((CURRENT * 100 / CONTEXT_SIZE))
  CACHE_TOTAL=$((CACHE_READ + CACHE_CREATE))
  CACHE_PCT=$((CACHE_TOTAL > 0 ? CACHE_READ * 100 / CACHE_TOTAL : 0))
else
  PERCENT=0
  CACHE_PCT=0
fi

# Context color based on usage
if [ $PERCENT -lt 50 ]; then
  CTX_COLOR=$GREEN
elif [ $PERCENT -lt 80 ]; then
  CTX_COLOR=$YELLOW
else
  CTX_COLOR=$RED
fi

printf "${WHITE}%s${RESET} ${DIM}|${RESET} ${DIM}Context:${RESET} ${CTX_COLOR}%d%%${RESET} ${DIM}|${RESET} ${DIM}Cache:${RESET} ${WHITE}%d%%${RESET} ${DIM}|${RESET} ${WHITE}\$%.2f${RESET}" "$MODEL" "$PERCENT" "$CACHE_PCT" "$COST"
```

2. Run `chmod +x ~/.claude/statusline.sh`

3. Read current `~/.claude/settings.json`
4. Create backup at `~/.claude/settings.json.backup`
5. Update `statusLine`:

```json
"statusLine": {
  "type": "command",
  "command": "~/.claude/statusline.sh",
  "padding": 0
}
```

6. Write back to `~/.claude/settings.json`

### If ccusage:

1. Read current `~/.claude/settings.json`
2. Create backup at `~/.claude/settings.json.backup`
3. Update `statusLine`:

```json
"statusLine": {
  "type": "command",
  "command": "npx -y ccusage@latest statusline --cost-source cc",
  "padding": 0
}
```

4. Write back to `~/.claude/settings.json`

### If Disable:

1. Read current `~/.claude/settings.json`
2. Create backup at `~/.claude/settings.json.backup`
3. Remove `statusLine` key from settings
4. Write back to `~/.claude/settings.json`

## Step 5: Confirm Success

Tell the user:

```
Statusline configured successfully!

IMPORTANT: Restart Claude Code for changes to take effect.
- Exit Claude Code
- Run `claude` again

Backup saved to ~/.claude/settings.json.backup
```

## Requirements

Native statusline requires `jq` for JSON parsing. Check with `which jq`.

If jq not installed, tell user:

- macOS: `brew install jq`
- Ubuntu/Debian: `sudo apt install jq`
- Other: https://jqlang.org/download/

## Docs

[Claude Code statusline docs](https://code.claude.com/docs/en/statusline) for more details.
