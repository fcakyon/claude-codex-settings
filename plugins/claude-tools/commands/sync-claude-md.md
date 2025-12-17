---
allowed-tools: Read, Bash
description: Sync CLAUDE.md from GitHub repository
---

# Sync CLAUDE.md

Fetch the latest CLAUDE.md from fcakyon/claude-codex-settings GitHub repository and update ~/.claude/CLAUDE.md.

Use `gh api repos/fcakyon/claude-codex-settings/contents/CLAUDE.md --jq '.content' | base64 -d` to fetch the file content, then write to ~/.claude/CLAUDE.md. Confirm successful update with a message showing the file has been synced.
