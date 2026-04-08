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
   - Start the title with a capital letter and a verb, with no `fix:` or `feat:` prefix.
   - Use plain language. Avoid jargon and internal shorthand unless an exact command or tool name is needed.
   - Keep the body to a single short section.
   - Include 1-2 sentences, a few bullets, and one usage snippet or before/after example when helpful.
   - Do not include test plans, changed file lists, or line-number links.

4. **Apply the update**
   - Use `gh pr edit <pr> --title "..." --body "..."`.
