---
name: pr-comment-workflow
description: This skill should be used when the user asks to "address PR comments", "resolve PR feedback", "respond to review", "write PR comment", "review PR comments", or needs guidance on PR comment style, response drafting, or review comment resolution.
---

# PR Comment Workflow

Procedural knowledge for writing and responding to PR review comments.

## Comment Style Rules

- lowercase start for all sentences
- never use em-dashes (`—`, `–`, `--`) between sentences, expressions, examples, or terms. Use commas, periods, or "or" instead
- no complex sentences
- simple terms, concise
- no end-of-sentence punctuation if possible
- max 1 sentence or shorter per comment
- polite when responding to real people
- bot comments: single concise sentence, no pleasantries ("good catch", "nice find", "thanks"), just state the fact directly

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
3. Never call the submit endpoint, leave for human to review and submit
4. Output the review URL so user can review and submit manually

## Reply Comment Posting

Reply comments (responses to existing threads) are posted directly, not as pending:
1. Use `gh api repos/{owner}/{repo}/pulls/comments/{comment_id}/replies -f body="..."`
2. Add a random 3-5 second delay between each reply: `sleep $((RANDOM % 3 + 3))`

## Resolving Review Feedback

1. Fetch unresolved comments from PR
2. For each comment, decide if valid concern or not
3. If valid: fix the code AND search for same problem in other codebase locations, fix all occurrences
4. If not valid: draft a concise response
5. If automated bot comment: single concise sentence, no pleasantries, just state the fact
6. Present all draft responses to user before posting
