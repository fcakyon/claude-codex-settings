---
description: Configure Claude Code statusline
---

# Statusline Setup

Configure the Claude Code statusline to display session context, cost, and account-wide usage.

## Step 1: Check Current Status

Read `~/.claude/settings.json` and `.claude/settings.local.json` to check if `statusLine` is configured.

Report:

- "Statusline configured in user settings: [command]" if found in ~/.claude/settings.json
- "Statusline configured in project settings: [command]" if found in .claude/settings.local.json
- "Statusline is not configured" if neither exists

## Step 2: Show Options

Tell the user:

```
Statusline Options:

1. Native (recommended for Claude subscription/API)
   - Shows: [Session] context% $cost | [5H] usage% time-until-reset
   - Account-wide 5H usage tracking with time until reset
   - Color-coded: green <50%, yellow 50-80%, red >80%
   - Requires: Claude subscription (Max/Pro) or Claude API key
   - Does NOT work with: z.ai, third-party endpoints

2. ccusage (for external endpoints)
   - Shows: context%, session/daily cost
   - Works with: Anthropic, z.ai, third-party endpoints
   - Limitation: No account-wide 5H block usage info

3. Disable - Remove statusline
```

## Step 3: Ask for Choice

Use AskUserQuestion:

- question: "Which statusline do you want?"
- header: "Statusline"
- options:
  - label: "Native (Claude subscription/API)"
    description: "Session + account-wide 5H usage with reset time"
  - label: "ccusage (external endpoints)"
    description: "Works with z.ai - no 5H block info"
  - label: "Disable"
    description: "Remove statusline"

## Step 4: If Native Selected

### Ask where to install

Use AskUserQuestion:

- question: "Where should the statusline be configured?"
- header: "Location"
- options:
  - label: "User settings (global)"
    description: "~/.claude/settings.json - applies to all projects"
  - label: "Project local"
    description: ".claude/settings.local.json - this project only"

### Check for existing config

If statusLine already exists in chosen location, use AskUserQuestion:

- question: "Statusline already configured. Replace it?"
- header: "Override"
- options:
  - label: "Yes, replace"
    description: "Override existing statusline config"
  - label: "No, cancel"
    description: "Keep current config"

If user chooses "No, cancel", stop and say "Setup cancelled."

### Install Native

1. Read `${CLAUDE_PLUGIN_ROOT}/scripts/statusline.sh`
2. Write to `~/.claude/statusline.sh`
3. Run `chmod +x ~/.claude/statusline.sh`
4. Read current settings file (user or project based on choice)
5. Create backup with `.backup` suffix
6. Add/update `statusLine`:

```json
"statusLine": {
  "type": "command",
  "command": "~/.claude/statusline.sh",
  "padding": 0
}
```

7. Write back to settings file

## Step 5: If ccusage Selected

### Ask where to install

Use AskUserQuestion:

- question: "Where should the statusline be configured?"
- header: "Location"
- options:
  - label: "User settings (global)"
    description: "~/.claude/settings.json - applies to all projects"
  - label: "Project local"
    description: ".claude/settings.local.json - this project only"

### Check for existing config and confirm override (same as Native)

### Install ccusage

1. Read current settings file
2. Create backup with `.backup` suffix
3. Add/update `statusLine`:

```json
"statusLine": {
  "type": "command",
  "command": "npx -y ccusage@latest statusline --cost-source cc",
  "padding": 0
}
```

4. Write back to settings file

## Step 6: If Disable Selected

1. Read `~/.claude/settings.json`
2. Create backup
3. Remove `statusLine` key if exists
4. Write back

Also check `.claude/settings.local.json` and remove `statusLine` if present.

## Step 7: Confirm Success

Tell the user:

```
Statusline configured successfully!

IMPORTANT: Restart Claude Code for changes to take effect.
- Exit Claude Code (Ctrl+C or /exit)
- Run `claude` again

Backup saved to [settings-file].backup
```

## Requirements

Native statusline requires `jq`. Check with `which jq`.

If jq not installed:

- macOS: `brew install jq`
- Ubuntu/Debian: `sudo apt install jq`
- Other: https://jqlang.org/download/
