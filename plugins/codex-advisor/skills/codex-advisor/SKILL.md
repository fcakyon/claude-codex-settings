---
name: codex-advisor
description: This skill should be used when the user asks for a "GPT second opinion", wants a "cross-model review", needs to "check a plan before committing", wants another view after repeated failures, or explicitly invokes "codex-advisor".
---

# Codex Advisor

Get a focused second opinion from GPT through the Codex CLI, without handing the
work over to it.

## Route by tool

1. In Claude Code, delegate to the native `codex-advisor` agent. It receives the
   recent conversation automatically, so do not paste the history yourself.
2. Elsewhere, run this exact shape from this skill's directory so the request
   reaches standard input:

   ```
   node scripts/ask_codex.mjs <<'REVIEW'
   the review request
   REVIEW
   ```

State the decision, the evidence behind it, and any constraint that changes the
verdict. Name the paths that matter: the reviewer has read-only access and
checks load-bearing claims itself.

Return the answer without rewriting it. If `codex` is missing or unauthenticated,
surface the error and ask the user to install it or sign in. Never review in its
place.

## Reviewer

Pinned to `gpt-5.6-sol` at medium reasoning effort. Inside Codex that may be the
model already doing the work, so set `CODEX_ADVISOR_MODEL` to a different one.

## Weighing the answer

Give the verdict serious weight. If a step it recommends fails when tried, or a
file contradicts a specific claim, surface the conflict instead of following the
review blindly.
