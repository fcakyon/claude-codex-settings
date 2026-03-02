---
name: pr-comment-workflow
description: This skill should be used when the user asks to "address PR comments", "resolve PR feedback", "respond to review", "write PR comment", "review PR comments", or needs guidance on PR comment style, response drafting, or review comment resolution.
---

# PR Comment Workflow

Procedural knowledge for writing and responding to PR review comments.

## Comment Style Rules

- lowercase start for all sentences
- no em-dashes, no complex sentences
- simple terms, concise
- no end-of-sentence punctuation if possible
- max 1 sentence or shorter per comment
- polite when responding to real people
- few words is enough for automated bot comments

## Review Comment Rules

- Only create pending PR comments, never submit/confirm review automatically
- Leave all comments for human review before posting
- When creating review comments, follow the style rules above

## Pending Review API Workflow

When posting review comments via gh api, use the two-step pending flow:

1. Create pending review:
   `gh api repos/{owner}/{repo}/pulls/{number}/reviews -f event=PENDING -f body=""`
2. Add comments to pending review:
   `gh api repos/{owner}/{repo}/pulls/{number}/reviews/{review_id}/comments -f body="..." -f path="..." -F line=N -f side=RIGHT`
3. Never call the submit endpoint — leave for human to review and submit
4. Output the review URL so user can review and submit manually

## Resolving Review Feedback

1. Fetch unresolved comments from PR
2. For each comment, decide if valid concern or not
3. If valid: fix the code AND search for same problem in other codebase locations — fix all occurrences
4. If not valid: draft a concise response
5. If automated bot comment: few words response is enough
6. Present all draft responses to user before posting
