---
name: commit-workflow
description: This skill should be used when user asks to "commit these changes", "write commit message", "stage and commit", "create a commit", "commit staged files", or runs /commit-staged or /commit-creator commands.
---

# Commit Workflow

Complete workflow for creating commits following project standards.

## Process

1. **Use commit-creator agent**
   - Run `/commit-staged [context]` for automated commit handling
   - Or follow manual steps below

2. **Analyze staged files only**
   - Check all staged files: `git diff --cached --name-only`
   - Read diffs: `git diff --cached`
   - Completely ignore unstaged changes

3. **Commit message format**
   - First line: `{type}: brief description` (max 50 chars)
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `build`
   - Focus on 'why' not 'what'
   - 1 sentence conventional style + 1 sentence motivation/findings if possible
   - For complex changes, add bullet points after blank line

4. **Message examples**
   - `feat: implement user authentication system`
   - `fix: resolve memory leak in data processing pipeline`
   - `refactor: restructure API handlers to align with project architecture`

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
- Reference related code if helpful
- One logical change per commit
- Ensure README reflects implementation
