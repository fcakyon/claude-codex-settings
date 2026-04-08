---
name: review-pr
description: This skill should be used when user asks to "review a PR", "review pull request", "review this pr", "code review this PR", "check PR #N", provides a GitHub PR URL, or explicitly invokes "review-pr".
---

# Review PR

Review a pull request for bugs, regressions, missing tests, and risky changes.

When explicitly invoked with extra text, treat that text as the PR number or URL. If no PR
reference is provided, infer it from the current branch.

## Process

1. **Preferred execution**
   - If subagents are available, use `github-dev:pr-reviewer` and pass the PR reference.
   - Otherwise follow the manual steps below.

2. **Parse PR reference**
   - If a PR number or URL is provided, extract owner, repo, and PR number.
   - If not, auto-detect the PR from the current branch with `gh pr view --json number,headRefName`.

3. **Fetch PR data**
   - Use `gh pr diff <number>` for the full diff.
   - Use `gh pr view <number> --json files` for the changed file list.
   - Skip generated or vendored files such as `.lock`, `.min.js`, `.min.css`, `dist/`, `build/`, `vendor/`, `node_modules/`, `_pb2.py`, and images.

4. **Review focus**
   - Only report issues that require fixes.
   - Only review PR changes, never pre-existing issues in unchanged code.
   - Prioritize bugs, security issues, breaking changes, performance issues, edge cases, and missing tests.
   - Combine related issues that share the same root cause.
   - Keep the list short and high signal.

5. **Review comment rules**
   - Only create pending PR comments, never submit or confirm the review automatically.
   - Use `gh` for GitHub operations.
   - Start comments in lowercase, keep them short, avoid end punctuation when possible.
   - Use simple language for both bot-facing and human-facing comments.

## Output Format

If issues are found, report them in descending severity with file references and a final
recommendation of `NEEDS_CHANGES`.

If no issues are found, return `APPROVE - No fixes required`.
