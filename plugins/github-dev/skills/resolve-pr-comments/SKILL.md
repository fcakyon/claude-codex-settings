---
name: resolve-pr-comments
description: This skill should be used when user asks to "address PR comments", "resolve PR feedback", "handle review comments", "fix PR issues", "respond to PR review", or explicitly invokes "resolve-pr-comments".
---

# Resolve PR Comments

Analyze unresolved PR review comments, fix valid concerns, and draft responses for comments
that do not require code changes.

When explicitly invoked with extra text, treat that text as the PR number or URL. If no PR
reference is provided, infer it from the current branch.

## Process

1. **Preferred execution**
   - If subagents are available, use `github-dev:pr-comment-resolver` and pass the PR reference.
   - Otherwise follow the manual steps below.

2. **Fetch unresolved comments**
   - If a PR number or URL is provided, use it directly.
   - Otherwise auto-detect the PR from the current branch with `gh pr view --json number,headRefName`.
   - Fetch inline comments with `gh api repos/{owner}/{repo}/pulls/{number}/comments`.
   - Fetch review-level comments with `gh pr view <number> --json reviews,comments`.
   - Filter to unresolved or pending threads.

3. **Resolve each comment**
   - If the comment is valid, fix the code and search the codebase for the same problem in other locations.
   - Fix all matching occurrences, not just the location mentioned in the comment.
   - If the comment does not require a code change, draft a concise reply.
   - If the comment is from a bot, reply with a direct factual sentence and no pleasantries.

4. **Reply style**
   - Start in lowercase.
   - Use simple language and short sentences.
   - Avoid end punctuation when possible.
   - Be concise and polite when replying to real people.

5. **Never auto-submit**
   - Present all draft responses before posting them.
   - Reply comments are posted directly with `gh api repos/{owner}/{repo}/pulls/comments/{comment_id}/replies -f body="..."`.
   - Add a random 3-5 second delay between posted replies with `sleep $((RANDOM % 3 + 3))`.
