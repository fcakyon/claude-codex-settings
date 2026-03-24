---
name: pr-comment-workflow
description: "Write, respond to, and resolve PR review comments using pending review workflows and project style conventions. Use when the user asks to address PR comments, resolve PR feedback, respond to review, write PR comments, or needs guidance on review comment resolution."
---

# PR Comment Workflow

## 1. Comment Style Rules

- lowercase start for all sentences
- never use em-dashes (`---`, `--`, `--`) between sentences, use commas, periods, or "or" instead
- simple terms, concise, no complex sentences
- no end-of-sentence punctuation if possible
- max 1 sentence or shorter per comment
- polite when responding to real people
- bot comments: single concise sentence, no pleasantries, just state the fact directly

## 2. Creating Review Comments (Pending Flow)

Only create pending PR comments. Never submit/confirm review automatically.

```bash
# Step 1: Create pending review
gh api repos/{owner}/{repo}/pulls/{number}/reviews -f event=PENDING -f body=""

# Step 2: Add comments to pending review
gh api repos/{owner}/{repo}/pulls/{number}/reviews/{review_id}/comments \
  -f body="..." -f path="..." -F line=N -f side=RIGHT

# Step 3: Output the review URL for human to review and submit
# Never call the submit endpoint
```

## 3. Posting Reply Comments

Reply comments (responses to existing threads) are posted directly, not as pending:

```bash
gh api repos/{owner}/{repo}/pulls/comments/{comment_id}/replies -f body="..."
sleep $((RANDOM % 3 + 3))  # 3-5 second delay between replies
```

## 4. Resolving Review Feedback

1. Fetch unresolved comments from PR
2. For each comment, decide if valid concern or not
3. If valid: fix the code AND search for the same problem in other codebase locations, fix all occurrences
4. If not valid: draft a concise response
5. If automated bot comment: single concise sentence, no pleasantries, just state the fact
6. Present all draft responses to user before posting
