---
name: simplify
description: This skill should be used when the user asks to "simplify", "clean up the diff", "run simplify", "simplify the changes", "review changed code for cleanup", explicitly invokes "/simplify", or asks to "commit without simplify", "skip simplify for this commit", or "commit this but skip simplify". Reviews changed code across reuse, simplification, efficiency, and altitude, or grants an explicit one-commit bypass. Not for correctness bugs.
---

# Simplify

`/simplify → 4 cleanup agents in parallel → apply the fixes`

You are improving the quality of the changed code, not hunting for bugs. Review it for reuse, simplification, efficiency, and altitude issues, then fix what you find. Do not look for correctness bugs, that is what `/code-review` is for.

## Explicit commit bypass

If the user explicitly asks to commit while skipping simplify, skip the review phases below:

1. State that simplify will be skipped for one commit and normal Git hooks will still run.
2. Run this exact command from the worktree:

```bash
echo simplify-guard:bypass
```

3. Commit normally without `--no-verify`.

Never infer permission to bypass from the size, urgency, or type of change. The user must explicitly name simplify when asking to skip it.

## Phase 0 — Gather the diff

Run `git diff @{upstream}...HEAD` (or `git diff main...HEAD` / `git diff HEAD~1` if there's no upstream) to get the unified diff under review. If there are uncommitted changes, or the range diff is empty, also run `git diff HEAD` and include the working-tree changes in scope, the review often runs before the commit. If a PR number, branch name, or file path was passed as an argument, review that target instead. Treat this diff as the review scope.

## Phase 1 — Review (4 cleanup agents in parallel)

Run **4 distinct reviews**, one for each angle below. Launch four independent agents concurrently when capacity allows. If fewer than four slots are available, run the remaining angles in the primary agent or in later waves. Never omit or combine an angle. Pass each agent the diff and its assigned angle. Each returns its findings with `file`, `line`, a one-line `summary`, and the concrete cost (what is duplicated, wasted, or harder to maintain).

### Reuse

Flag new code that re-implements something the codebase already has. Grep shared/utility modules and files adjacent to the change, and name the existing helper to call instead.

### Simplification

Flag unnecessary complexity the diff adds: redundant or derivable state, copy-paste with slight variation, deep nesting, dead code left behind. Name the simpler form that does the same job.

### Efficiency

Flag wasted work the diff introduces: redundant computation or repeated I/O, independent operations run sequentially, blocking work added to startup or hot paths. Also flag long-lived objects built from closures or captured environments, they keep the entire enclosing scope alive for the object's lifetime (a memory leak when that scope holds large values). Prefer a class/struct that copies only the fields it needs. Name the cheaper alternative.

### Altitude

Check that each change is implemented at the right depth, not as a fragile bandaid. Special cases layered on shared infrastructure are a sign the fix isn't deep enough, prefer generalizing the underlying mechanism over adding special cases.

## Phase 2 — Apply the fixes

Wait for all four agents to complete, dedup findings that point at the same line or mechanism, and fix each remaining one directly. Skip any finding whose fix would change intended behavior, require changes well outside the reviewed diff, or that you judge to be a false positive, note the skip rather than arguing with it.

## Phase 3: Mark completion

After all accepted fixes are applied, resolve the reviewed worktree with `git -C '<reviewed-worktree>' rev-parse --show-toplevel`, then put that absolute path in this command:

```bash
echo simplify-guard:complete '/absolute/path/to/reviewed/worktree'
```

This lets the bundled guard record completion against the reviewed worktree even when the session started elsewhere. Do not run it before the review and cleanup phases finish.

Finish with a brief summary of what was fixed and what was skipped (or confirm the code was already clean).
