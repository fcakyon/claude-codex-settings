---
allowed-tools: Task, Read, Grep, Glob, Bash
argument-hint: <PR number or URL>
description: Analyze and address unresolved PR review comments
---

# Resolve PR Comments

Use the pr-comment-resolver agent to analyze unresolved review comments,
fix valid concerns across the codebase, and draft responses for invalid ones.

## PR Reference

$ARGUMENTS

Task(
description: "Resolve PR review comments",
prompt: "Analyze unresolved PR review comments. Fix valid concerns (check ALL occurrences in codebase). Draft responses for others. PR reference: $ARGUMENTS",
subagent_type: "github-dev:pr-comment-resolver"
)
