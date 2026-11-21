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

**First, run the `/simplify` skill on the staged diff and apply its findings before committing, docs-only commits included.**

1. **Preferred execution**
   - If subagents are available, use `github-dev:commit-creator` for the full workflow.
   - Pass along any extra invocation text as additional context.
   - Otherwise follow the manual steps below.

2. **Analyze staged files only**
   - Check all staged files: `git diff --cached --name-only`
   - Read diffs: `git diff --cached`
   - When a relevant check could pick up unstaged or untracked code, use the bundled `scripts/verify-staged COMMAND [ARG...]` from the repository. It runs the command in a temporary export of the staged tree and prints its Git tree ID on success. Supply a command that builds or starts its own candidate there. Dependencies, ignored files, submodule checkouts and Git history are outside the export. Confirm a previously tested tree still matches `git write-tree` before reusing its result.
   - Completely ignore unstaged changes

3. **Commit message format**
   - First line: `{type}: brief description` (max 50 chars)
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `build`
   - Use plain language. Avoid jargon, buzzwords, and repo shorthand unless an exact command or tool name is needed.
   - Use findings and motivation from session history when available.
   - Focus on 'why' not 'what'
   - 1 sentence conventional style + 1-2 short motivation/findings sentences if possible
   - For complex changes, add bullet points after blank line
   - End with the required verification trailer from step 4

4. **Verification trailer (required in every commit)**
   - After a blank line, end the message with one lowercase `verification:` line. The github-dev commit hook blocks any commit message without it.
   - Name the relevant checks actually completed for the staged changes and their results.
   - If none ran, write `verification: none (<reason>)` so unverified commits stay searchable.
   - Include a material failure or blocker without claiming it passed. Keep future checks out of the trailer.
   - If the project uses `project-qa`, its `run --verification` output supplies case IDs and observed statuses. For a journey, include the environment and observed behavior, for example `verification: local Chrome mailbox refresh kept one sync request and manual sync started a second`.
   - [Source](https://claude.dev/blog/how-the-claude-code-team-thinks-about-verification)

5. **Message examples**

   ```text
   fix: stop duplicate jobs on save

   verification: save regression test passed 20 consecutive runs
   ```

   ```text
   docs: add skills install snippets

   verification: none (docs only, no runnable checks)
   ```

6. **Documentation update**
   - Check README.md for:
     - New features that should be documented
     - Outdated descriptions no longer matching implementation
     - Missing setup instructions for new dependencies
   - Update as needed based on staged changes

7. **Execution**
   - Commit uses HEREDOC syntax for proper formatting
   - Verify commit message has correct format

## Best Practices

- Analyze staged files before writing message
- Keep first line under 50 chars
- Use active voice in message
- Use simple words that still stay accurate
- Prefer session findings over repeating raw diff details
- One logical change per commit
- Ensure README reflects implementation
