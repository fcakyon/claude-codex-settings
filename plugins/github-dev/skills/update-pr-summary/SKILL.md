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
   - Body: open on why, then short scannable bullets (one point each). Lead with the most visual proof: a screenshot for UI or output changes, a benchmark table for results, else a `diff`, before/after, or runnable CLI snippet. See the `create-pr` skill for embedding images with a commit-pinned raw URL.
   - Numbers win: put benchmarks, counts, speedups and comparisons in a markdown table.
   - One read, one section, no headers. Plain words, no buzzwords.
   - No test plans, file lists, or line links.

4. **Apply the update**
   - Use `gh pr edit <pr> --title "..." --body "..."`.
