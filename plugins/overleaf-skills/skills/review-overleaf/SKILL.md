---
name: review-overleaf
description: This skill should be used when user asks to "fetch overleaf review comments", "address overleaf reviews", "apply overleaf comments", "review my overleaf paper", "sync overleaf feedback to local", "what comments are on my overleaf doc", or wants to act on Overleaf reviewer feedback in a local git-tracked LaTeX repo.
---

# Review Overleaf

Pull unresolved review threads from an Overleaf project, locate each in the local repo, propose edits the user reviews, and apply them. Does not push back to Overleaf — the web UI is still the place to mark threads resolved after the user verifies the local change.

## Step 1: Resolve project ID

Accept any of:

- Raw 24-char hex ID (`^[0-9a-f]{24}$`)
- Full URL like `https://www.overleaf.com/project/<id>` — extract via regex
- Project name in quotes — call:
  ```bash
  python3 ${CLAUDE_PLUGIN_ROOT}/scripts/overleaf_reviews.py --list-projects
  ```
  Each line is `<24-hex>  <accessLevel>  <name>`. Fuzzy-match the name. If multiple match, AskUserQuestion to disambiguate.

If the user has not given a project ID at all, run `--list-projects` and show the user the table so they can pick one.

## Step 2: Cookie precheck

If `~/.claude/overleaf-skills/cookie` does not exist, tell the user to "set up overleaf" (which triggers the `setup` skill) and stop.

If it exists but auth fails (the next script call returns a refresh hint), point at the same setup skill and stop.

## Step 3: Access-level guard

If the project ID came from name resolution, check the matched entry's `accessLevel`. If `readOnly`, warn:

> Project is read-only. You can edit local files but cannot sync them back to Overleaf via the web UI; you would need to copy-paste manually. Continue?

For `owner`, `readAndWrite`, or `review`, proceed silently.

## Step 4: Fetch comments

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/overleaf_reviews.py --json --repo . < project-id > --unresolved-only
```

Parses to a JSON array. Each record has: `thread_id`, `doc_id`, `snippet`, `offset`, `resolved`, `messages` (list of `{user, ts, content}`), `file`, `line`. The `file` and `line` are null when the snippet did not match any local `*.tex`.

## Step 5: Edit loop

For each record where `file` is non-null:

1. `Read` the file at `line` ± 5 lines for context.
2. Summarize the comment thread in one sentence: who said what.
3. Propose a concrete edit grounded in the comment text. If the comment is a question (e.g., "did you mean X?"), the edit should answer it in the prose; if it's a correction (e.g., "wrong notation"), the edit should make the correction.
4. Apply via `Edit`. Do not batch — one comment, one edit, then move on.

Skip records where `file` is null (snippet did not map). Collect them in an `<unmapped>` list.

## Step 6: Wrap up

After the loop:

1. Run `git diff` and show the user the full set of changes.
2. List the `<unmapped>` records (if any) with `doc_id` + snippet preview, so the user can hunt them manually.
3. Suggest a commit message in the style: `address overleaf review: <one-line summary of the changes>`. Do NOT auto-commit. The user can run `/github-dev:commit-staged` or commit by hand.
4. Remind the user to mark the addressed threads as resolved in the Overleaf web UI once they verify the local diff.

## Non-goals

- No re-upload to Overleaf (no write API used).
- No thread resolution in Overleaf (web UI only).
- No `.bib` edits unless a comment specifically targets a citation.
- No multi-line snippets that span paragraph breaks — those land in `<unmapped>` for v1; the snippet matcher is line-anchored.

## Pairs naturally with

- `github-dev` — `/github-dev:commit-staged` after the edit loop, `/github-dev:create-pr` if the project is collaborative.
