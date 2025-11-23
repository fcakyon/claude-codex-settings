---
allowed-tools: Read
description: Refresh context with CLAUDE.md instructions
---

# Load CLAUDE.md

Read and inject CLAUDE.md content into the current context. Useful for refreshing instructions in long conversations.

1. Read `~/.claude/CLAUDE.md` (global instructions)
2. Read `CLAUDE.md` or `AGENTS.md` from the current project directory (whichever exists)
3. Acknowledge that context has been refreshed with these instructions
