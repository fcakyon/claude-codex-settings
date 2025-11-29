---
allowed-tools: Task, Read, Grep, SlashCommand, Bash(git checkout:*), Bash(git -C:* checkout:*)
argument-hint: [context]
description: Create pull request with optional context
---

# Create Pull Request

Use the pr-creator agent to handle the complete PR workflow including branch creation, commits, and PR submission.

## Additional Context

$ARGUMENTS

Task(
description: "Create pull request",
prompt: "Handle the complete PR workflow including branch creation, commits, and PR submission. Additional context: $ARGUMENTS",
subagent_type: "github-dev:pr-creator"
)
