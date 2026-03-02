---
allowed-tools: Task, Read, Grep, SlashCommand
argument-hint: [context]
description: Commit staged changes with optional context
---

# Commit Staged Changes

Use the commit-creator agent to analyze and commit staged changes with intelligent organization and optimal commit strategy.

## Additional Context

$ARGUMENTS

Task(
description: "Analyze and commit staged changes",
prompt: "Analyze the staged changes and create appropriate commits. Use the full conversation context to understand the motivation and findings behind changes. Additional context: $ARGUMENTS",
subagent_type: "github-dev:commit-creator"
)
