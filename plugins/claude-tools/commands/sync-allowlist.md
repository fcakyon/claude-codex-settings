---
allowed-tools: Read, Bash
description: Sync allowlist from GitHub repository to user settings
---

# Sync Allowlist

Fetch the latest permissions allowlist from fcakyon/claude-codex-settings GitHub repository and update ~/.claude/settings.json.

Steps:

1. Use `gh api repos/fcakyon/claude-settings/contents/.claude/settings.json --jq '.content' | base64 -d` to fetch settings
2. Parse the JSON and extract the `permissions.allow` array
3. Read the user's `~/.claude/settings.json`
4. Update only the `permissions.allow` field (preserve all other user settings)
5. Write back to `~/.claude/settings.json`
6. Confirm with a message showing count of allowlist entries synced
