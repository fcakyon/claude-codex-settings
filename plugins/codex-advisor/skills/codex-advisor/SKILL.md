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
2. In Codex, Cursor, or Gemini CLI, locate this skill's directory and run
   `node scripts/ask_codex.mjs`. Pass the review request on standard input.

The request must include the decision or conclusion, the relevant recent
context and evidence, and any constraints or alternatives that affect the
verdict. Include only facts that matter to the decision.

Return the reviewer's answer without rewriting it. If `codex` is missing or not
authenticated, surface the command error and ask the user to install the Codex
CLI or sign in. Do not fall back to the host model.

## Picking the reviewer

The review runs on whatever model `~/.codex/config.toml` sets. In Codex itself
that is the same model already doing the work, which is a weak second opinion,
so set `CODEX_ADVISOR_MODEL` to a different one before calling.

## Weighing the answer

Give the verdict serious weight. If a step it recommends fails when tried, or a
file contradicts a specific claim, surface the conflict instead of following the
review blindly.
