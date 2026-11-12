---
name: run-qa
description: This skill should be used when user asks to "run QA", "verify real playback", "test provider connections", "test mobile touch gestures", or "check website, extension or Android flows" with tracked journeys.
---

# Run project QA

Read `.agents/skills/qa/SKILL.md` and `.agents/qa/config.json`, then run `project-qa run --root <repo>`. If absent, use setup. `--filter <id-substring>` limits a follow-up run and repeats, so run a fixed CI case list with one `--filter` per case in one invocation. `--base-url <url>` selects a temporary website target without editing project settings. Check `report.json` for the effective `baseUrl` and tested revision, then confirm the browser destination; API and auth URLs remain separately configured.

Use deterministic scripts. Interactive investigation can repair a failed journey, then put repeatable steps in its tracked suite. Never replace failed live behavior with mocked success.

Reports distinguish pass, fail and blocked, record Git revision, and keep screenshots private. Exit 0 means selected cases passed, 1 means failure, 2 means blocked. Start a fix from the failure details the runner prints and records, listed in the Runner API. Report omitted cases and configured gaps separately. A passing journey proves its assertions, not uninspected visual quality or runtime health. Mouse or tap-only journeys do not prove touch holds, drags or scrolling. For a UI audit, use the installed `ui-regression` skill when available and report functional, rendered-quality and runtime verdicts separately.

Read [sessions](../../references/sessions.md) before recovering login, [telemetry](../../references/telemetry.md) before production traffic, and [surface requirements](../../references/surfaces.md) for relevant components. [Runner API](../../references/runner.md) defines executable cases and optional browser-network-cli diagnostics, including installation when needed.

Verify cleanup of created data and tabs. Keep saved sessions for the next run. Do not close personal browser tabs, log out providers after each test, or run suites sharing a `stateGroup` concurrently. Parallel runs each need their own server port and `QA_STATE_DIR`.
