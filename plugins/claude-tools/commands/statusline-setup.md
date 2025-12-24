---
description: Configure Claude Code status line
---

# Statusline Setup

Configure the Claude Code status line to display context usage, cost, and model information.

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
   - Shows: [Model] Session Context% | $Session Cost
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
  - label: "Native (session data)"
    description: "Anthropic API only - fast, no dependencies"
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

if [ "$USAGE" != "null" ] && [ "$CONTEXT_SIZE" != "null" ]; then
  CURRENT=$(echo "$USAGE" | jq '.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens')
  PERCENT=$((CURRENT * 100 / CONTEXT_SIZE))
else
  PERCENT=0
fi

printf "[%s] %d%% | $%.2f" "$MODEL" "$PERCENT" "$COST"
```

2. Run `chmod +x ~/.claude/statusline.sh`

3. Read current `~/.claude/settings.json`
4. Create backup at `~/.claude/settings.json.backup`
5. Update `statusLine`:

```json
"statusLine": {
  "type": "command",
  "command": "~/.claude/statusline.sh"
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
