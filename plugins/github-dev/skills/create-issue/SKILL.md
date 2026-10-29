---
name: create-issue
description: This skill should be used when the user asks to "create an issue", "file a bug", "report a problem", "rewrite an issue", or "improve an issue title or body".
---

# Create or revise an issue

An issue describes a problem or missing capability. A PR describes a proposed change.
Keep their writing rules separate. For PRs, use [create-pr](../create-pr/SKILL.md).

## Title

Use a concise statement of the problem, naming the affected behavior. Do not use an
imperative change request such as "Fix", "Add", "Enable", or "Keep" as the default.

- "Visitor country is unavailable to upstream apps"
- "GeoIP data becomes stale on running installations"
- "Login returns to the wrong page after checkout"

## Body

Follow the repository's issue template and the user's requested format. Otherwise use:

```markdown
## Problem
One or two sentences naming the failure and its effect.

## Reproduction
1. The relevant setup or version.
2. The smallest steps that demonstrate the problem.

## Current behavior
What was observed, with a short error or result when useful.

## Desired behavior
The outcome the reporter needs.
```

For a missing feature, reproduce the current workflow that exposes the gap. If the
problem was not reproduced, say so instead of inventing steps or results. Add environment
details, evidence, or a proposed approach only when they help a maintainer act. Keep a
possible implementation separate from the desired outcome.

Remove repeated explanations, promotional claims, conversation history, full diagnostic
dumps, and details that do not help reproduce or resolve the issue. A few useful sections
are better than a long narrative or a checklist of every investigation step.

## Publish or update

Inspect repository guidance and templates, search for an existing issue, and verify the
claims before publishing. When revising, read the current issue and preserve useful
attachments, links, and user edits. Do not expand an issue's scope without user direction.

Use `gh issue create` or `gh issue edit` with `--title` and `--body-file`. Read back the
published title and body. Link related PRs, but use a closing reference only when the PR
addresses the issue's complete desired outcome.
