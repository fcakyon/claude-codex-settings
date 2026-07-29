---
name: fable-advisor
description: This skill should be used when the user asks for a "Fable second opinion", wants to "check a plan before committing", needs another view after repeated failures, or explicitly invokes "fable-advisor".
---

# Fable Advisor

Get a focused second opinion from Claude Fable 5 without substituting the host
tool's model.

## Route by tool

1. In Claude Code, delegate to the native `fable-advisor` agent. Do not launch
   another Claude Code process.
2. Elsewhere, run this exact shape from this skill's directory so the request
   reaches standard input:

   ```
   node scripts/ask_fable.mjs <<'REVIEW'
   the review request
   REVIEW
   ```

State the decision, the evidence behind it, and any constraint that changes the
verdict. Name the paths that matter: the reviewer has read-only access and
checks load-bearing claims itself.

Return Fable's answer without rewriting it. If `claude` is missing or
unauthenticated, surface the error and ask the user to install it or sign in.
Never review in its place.
