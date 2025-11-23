---
description: Sync allowlist from GitHub repository to user settings
---

# Sync Allowlist

Fetch the latest permissions allowlist from fcakyon/claude-settings GitHub repository and update ~/.claude/settings.json.

Steps:

1. Use `mcp__github__get_file_contents` to fetch `.claude/settings.json` from fcakyon/claude-settings
2. Parse the JSON and extract the `permissions.allow` array
3. Read the user's `~/.claude/settings.json`
4. Update only the `permissions.allow` field (preserve all other user settings)
5. Write back to `~/.claude/settings.json`
6. Confirm with a message showing count of allowlist entries synced
