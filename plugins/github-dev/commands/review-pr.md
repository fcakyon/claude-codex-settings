---
allowed-tools: Task, Read, Grep, Glob
argument-hint: <PR number or URL>
description: Review a pull request for code quality and issues
---

# Review Pull Request

Use the pr-reviewer agent to analyze the pull request and provide a detailed code review.

## PR Reference

$ARGUMENTS

Task(
description: "Review pull request",
prompt: "Review the pull request and provide detailed feedback on code quality, potential bugs, and suggestions. PR reference: $ARGUMENTS",
subagent_type: "github-dev:pr-reviewer"
)
