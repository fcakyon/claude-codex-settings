---
name: update-pr-summary
description: This skill should be used when user asks to "update PR summary", "update PR description", "rewrite PR body", "refresh PR title and body", or explicitly invokes "update-pr-summary".
---

# Update PR Summary

Update a PR title and body to describe the final change and evidence. Treat extra invocation
text as the PR reference and any requested corrections.

1. Read repository guidance and fetch the current body before editing:
   `gh pr view <pr> --json title,body,baseRefName,headRefName,url`.
2. Review the complete PR diff against its actual base, not this checkout's unrelated HEAD.
   Use `git diff <remote>/<base>...<head>` when those refs are current, otherwise `gh pr diff <pr>`.
   Ignore changes outside the PR and collect completed checks relevant to its current head.
3. Read [create-pr](../create-pr/SKILL.md) for title, body, evidence, and visual-hosting guidance.
   Apply the user's correction to the relevant portion. Preserve uploaded visuals, bot-added
   context, links, and valid results. An explicit full rewrite still keeps those unless the
   user asks to remove them. Rewrite stale claims and titles around the final scope.
4. Save the exact body to a temporary file outside the repo. Re-read the remote body just
   before writing. If it changed, incorporate those edits rather than overwriting them.
   Apply with `gh pr edit <pr> --title "..." --body-file <path>`.
5. Read back `title,body,url` and compare with the intended edit. Verify that preserved content,
   fences, tables, and links survived. Open the PR to check media rendering when relevant.
   Report the PR URL and any remaining evidence or upload gap.
