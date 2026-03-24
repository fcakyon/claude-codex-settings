---
name: commit-workflow
description: "Create well-formatted git commits by analyzing staged changes, generating conventional commit messages, and updating related documentation. Use when the user asks to commit changes, write a commit message, stage and commit, create a commit, or runs /commit-staged or /commit-creator commands."
---

# Commit Workflow

## Process

1. **Run commit-creator agent** (preferred)
   - `/commit-staged [context]` for automated commit handling
   - Or follow manual steps below

2. **Analyze staged files only**
   - List staged files: `git diff --cached --name-only`
   - Read diffs: `git diff --cached`
   - Ignore unstaged changes entirely

3. **Write commit message**
   - First line: `{type}: brief description` (max 50 chars)
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `build`
   - Focus on 'why' not 'what'
   - Add 1 sentence of motivation/findings when useful
   - For multi-part changes, add bullet points after blank line

   Example messages:
   ```
   feat: implement user authentication system
   fix: resolve memory leak in data processing pipeline
   refactor: restructure API handlers to align with project architecture
   ```

4. **Check documentation**
   - Review README.md for new features needing docs, outdated descriptions, or missing setup instructions
   - Update as needed based on staged changes

5. **Execute commit**
   - Use HEREDOC syntax for proper message formatting
   - Verify message format before committing
   - Never add test plans to commit messages

## Best Practices

- Analyze staged files before writing message
- Keep first line under 50 chars, use active voice
- One logical change per commit
- Ensure README reflects implementation
