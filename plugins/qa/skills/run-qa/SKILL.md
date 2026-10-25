---
name: run-qa
description: This skill should be used when user asks to "run QA", "verify real playback", "test provider connections", or "check website, extension or Android flows" with tracked journeys.
---

# Run project QA

Read `.agents/skills/qa/SKILL.md` and `.agents/qa/config.json`, then run `project-qa run --root <repo>`. If absent, use setup. `--filter <id-substring>` limits a follow-up run.

Use deterministic scripts. Interactive investigation can repair a failed journey, then put repeatable steps in its tracked suite. Never replace failed live behavior with mocked success.

Reports distinguish pass, fail and blocked, record Git revision, and keep screenshots private. Exit 0 means selected cases passed, 1 means failure, 2 means blocked. Report omitted cases and configured gaps separately.

Read [sessions](../../references/sessions.md) before recovering login, [telemetry](../../references/telemetry.md) before production traffic, and [surface requirements](../../references/surfaces.md) for relevant components. [Runner API](../../references/runner.md) defines executable cases and optional browser-network-cli diagnostics, including installation when needed.

Verify cleanup of created data and tabs. Keep saved sessions for the next run. Do not close personal browser tabs, log out providers after each test, or run suites sharing a `stateGroup` concurrently.
