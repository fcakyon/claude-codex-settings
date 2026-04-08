---
name: commit-staged
description: This skill should be used when user asks to "commit these changes", "write commit message", "stage and commit", "create a commit", "commit staged files", or explicitly invokes "commit-staged".
---

# Commit Staged

Complete workflow for creating commits following project standards.

When explicitly invoked with extra text, treat that text as additional context about the
changes and include it in commit planning and commit messages.
When session history includes findings, motivation, or rationale, include the strongest
points in the commit message body instead of relying on the diff alone.

## Process

1. **Preferred execution**
   - If subagents are available, use `github-dev:commit-creator` for the full workflow.
   - Pass along any extra invocation text as additional context.
   - Otherwise follow the manual steps below.

2. **Analyze staged files only**
   - Check all staged files: `git diff --cached --name-only`
   - Read diffs: `git diff --cached`
   - Completely ignore unstaged changes

3. **Commit message format**
   - First line: `{type}: brief description` (max 50 chars)
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `build`
   - Use plain language. Avoid jargon, buzzwords, and repo shorthand unless an exact command or tool name is needed.
   - Use findings and motivation from session history when available.
   - Focus on 'why' not 'what'
   - 1 sentence conventional style + 1-2 short motivation/findings sentences if possible
   - For complex changes, add bullet points after blank line

4. **Message examples**
   - `feat: add sign-in flow`
   - `fix: stop duplicate jobs on save`
   - `docs: add skills install snippets`

5. **Documentation update**
   - Check README.md for:
     - New features that should be documented
     - Outdated descriptions no longer matching implementation
     - Missing setup instructions for new dependencies
   - Update as needed based on staged changes

6. **Execution**
   - Commit uses HEREDOC syntax for proper formatting
   - Verify commit message has correct format
   - Don't add test plans to commit messages

## Best Practices

- Analyze staged files before writing message
- Keep first line under 50 chars
- Use active voice in message
- Use simple words that still stay accurate
- Prefer session findings over repeating raw diff details
- One logical change per commit
- Ensure README reflects implementation
