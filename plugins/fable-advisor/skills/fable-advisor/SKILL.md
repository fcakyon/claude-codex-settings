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
2. In Codex, Cursor, or Gemini CLI, locate this skill's directory and run
   `node scripts/ask_fable.mjs`. Pass the review request on standard input.

The request must include the decision or conclusion, the relevant recent
context and evidence, and any constraints or alternatives that affect the
verdict. Include only facts that matter to the decision.

Return Fable's answer without rewriting it. If `claude` is missing or not
authenticated, surface the command error and ask the user to install or sign in
to Claude Code. Do not fall back to the host model.
