---
name: create-pr
description: This skill should be used when user asks to "create a PR", "make a pull request", "open PR for this branch", "submit changes as PR", "push and create PR", or explicitly invokes "create-pr".
---

# Create PR

Create a PR a reviewer can understand without reading the conversation. Use extra invocation
text and session findings to explain the problem, final behavior, and evidence. Follow the
user's requested format and the target repo's guidance.

## Workflow

1. **Inspect the scope and base**
   - Read repository guidance and inspect `git status`, staged changes, and the current branch.
   - Honor staged-only requests. Never stage unrelated work or require a new commit when the
     branch already contains the requested changes.
   - Confirm the target remote and base branch. Before creating a branch from main/master,
     fetch that remote and fast-forward the local base with `git merge --ff-only <remote>/<base>`.
     Preserve dirty work and stop if fast-forwarding fails. Do not reset it away.
   - Create a short branch using the repo's naming convention. Never commit directly to main.

2. **Finish and inspect the change**
   - Run `/simplify` on the staged diff before committing and apply its findings. Docs-only
     diffs are a no-op. Follow `commit-staged` for any staged changes.
   - Update existing documentation only when the requested change makes it inaccurate.
   - Review `git diff <remote>/<base>...HEAD` across all commits. For an existing PR, use its
     actual base and head, or `gh pr diff <pr>` if this checkout is on another branch.
   - Run appropriate checks and collect their actual results. Verify session findings against
     the final change, including links, counts, errors, and benchmark provenance.

3. **Write and publish**
   - Use the title and body guidance below. If a PR already exists, use `update-pr-summary`
     rather than opening a duplicate.
   - Write the exact body to a temporary file outside the repo and pass `--body-file` to `gh`.
     Never interpolate text into a shell command or include command output by accident.
   - Push the branch and create with an explicit base, `--title`, `--body-file`, and `-a @me`.
   - Add a reviewer only if explicitly requested or recent PRs by this author have reviewers:
     `gh pr list --repo <owner>/<repo> --author @me --limit 5 --json reviewRequests`.
   - Read back the published title and body with `gh pr view <pr> --json title,body,url`.
     Check code fences, tables, links, and preserved media. For visual changes, open the PR
     and verify the images render. Report the URL and any incomplete verification.

## Title and body

- Title: start with a capitalized verb and name the concrete behavior, such as
  `Fix copied session text losing line breaks`. No type prefix, internal brand names, or
  vague claims. Rewrite the title and body when the final scope changes.
- Lead with the trigger and consequence: when does the bug happen, what goes wrong, and why
  does the fix matter? For a feature, show what the user can now do. Skip "This PR" openers.
- Keep distinct points in short bullets, usually 1-3. Do not squeeze several ideas into a
  paragraph or cut useful evidence to satisfy a word count. Small changes may need only
  one sentence and a snippet. Use short sections when reproduction, fix, and results need
  separation. Omit empty or boilerplate sections.
- For bugs, include the smallest useful reproduction, the actual error/output and expected
  behavior, then explain how the final change fixes it. Use exact logs where they show the
  failure. Skip setup noise, raw tool output, and the debugging diary.
- Show behavior with a copyable usage/reproduction snippet, a compact Before/After table,
  or separately labeled fenced Before and After outputs. Prefer these to red/green diff
  lines that force the reviewer to infer the outcome. Do not force snippets onto copy edits.
- Put measurements and main-versus-branch comparisons in a small table. State the dataset,
  workload, or sample count needed to interpret them. Link relevant issues, commits, docs,
  and result artifacts where they support the claim, rather than listing changed files.
- Include concise **completed validation**: the relevant command or check, its result, and
  material limitations or pre-existing failures. A future test checklist is not evidence.
  Do not claim full-run success from a focused check, or understate verified full runs.
- Include only implementation detail that explains the fix or a tradeoff. Mention net line
  counts or base-branch noise when they help distinguish the actual review scope.
- Never add AI attribution, session links, redundant captions, or a concluding sales pitch.

## Visual evidence and existing content

- UI/design changes need readable Before/After images or GIFs in a two-column table. Match
  viewport and scenario, and inspect the visuals before using them. Analysis/plot changes
  need representative outputs and measured results readable at the displayed size.
- Never commit PR screenshots or generated figures into the branch. Follow the user's and
  repo's hosting rules. Where release uploads are permitted, use an existing appropriate
  release and embed its asset URLs. Preserve existing GitHub attachment URLs as well.
- For Ultralytics repos, never upload visuals to release assets. Give the user absolute local
  paths, the PR link, and the sentence/table cell where each image belongs for manual upload.
  Do not invent attachment URLs or claim pending uploads are visible.
- When editing a body, preserve user-uploaded images/GIFs, bot-added context, related links,
  and still-valid evidence unless the user asks to remove them. Edit the relevant portion
  rather than replacing the whole body. Keep proof in the body instead of duplicating it
  in a separate comment.

## Example: bug with completed checks

````markdown
Copying a multiline command into a session loses its line breaks.

| Before | After |
|---|---|
| Pasted command becomes one line | Original line breaks survive |

- Preserve clipboard newlines at paste time
- Reuse the existing text insertion path

**Reproduce**
```sh
printf 'first\nsecond\n' | pbcopy
# Paste into an open session.
```

**Checked:** paste regression passes for multiline and single-line commands.
````

Adapt this shape to the evidence. For UI changes, comparison cells should carry the actual
screenshots/GIFs. For long outputs, use separate fenced blocks outside the table.
