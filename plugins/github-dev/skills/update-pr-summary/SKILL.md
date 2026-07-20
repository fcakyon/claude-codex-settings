---
name: update-pr-summary
description: This skill should be used when user asks to "update PR summary", "update PR description", "rewrite PR body", "refresh PR title and body", or explicitly invokes "update-pr-summary".
---

# Update PR Summary

Update a PR title and description based on the complete changeset.

When explicitly invoked with extra text, treat that text as the PR number or URL.

## Process

1. **Fetch PR info**
   - Use `gh pr view <pr> --json title,body,baseRefName,headRefName`.

2. **Analyze the complete changeset**
   - Use `git diff <base-branch>...HEAD` to review all committed changes in the branch.
   - Ignore unstaged changes.
   - Make the summary describe the full branch diff, not just the latest commit.

3. **Generate the updated summary**
   - Follow the `create-pr` skill format for title and body.
   - Title: a short human headline, capital first letter, no `fix:` or `feat:` prefix. Lead with the outcome, punchy over exhaustive.
   - Body: open on why it exists, then show it with a `diff`, a before/after, or a runnable CLI snippet.
   - Numbers win: benchmarks, counts, speedups, comparisons over adjectives.
   - One read, one section. No headers, no bullet dump. Plain words, no buzzwords.
   - No test plans, file lists, or line links.

4. **Apply the update**
   - Use `gh pr edit <pr> --title "..." --body "..."`.
