---
name: setup
description: This skill should be used when user asks to "set up QA", "create real integration tests", or "add project QA journeys" for websites, extensions, Android apps, native macOS apps or backends.
---

# Set up project QA

The plugin supplies the runner. The project owns journeys, selectors, fixtures and outcome assertions. Execution belongs in tracked scripts. Skills guide discovery and interpretation.

1. Run `npm ci --prefix <plugin-root>` once. Use `node <plugin-root>/scripts/qa.mjs` directly, or `npm link` from the plugin directory to install `project-qa`. In CI, pin the plugin to a commit and bump it on purpose. When CI runs as root over a checkout owned by another user, add it to git's `safe.directory`, or reports record an empty revision and a clean tree.
2. Run `project-qa discover --root <repo>`. Read the owning routes, callers, test commands, manifests and related repositories. Discovery identifies candidate coverage, not working features.
3. Run `project-qa setup --root <repo> --base-url <verified-url>`, adding `--extension <built-directory>` and repeated `--related <relative-repo>` where relevant. It creates `.agents/qa/config.json`, `.agents/qa/suite.mjs` and `.agents/skills/qa/SKILL.md`. Existing files are preserved. Discovery evidence stays in command output, so runtime configuration does not become a stale copy of package manifests.
4. Replace generated blocked cases with real journeys using [the API](../../references/runner.md) and [surface requirements](../../references/surfaces.md). Reuse existing integration tests before writing another owner for the same contract.
5. Configure [sessions](../../references/sessions.md) and [telemetry isolation](../../references/telemetry.md) before live runs. Test accounts have ordinary product permissions.
6. Run the suite, inspect failures, repair incorrect test assumptions, and rerun affected journeys. Run setup again to verify it preserves specialization. Update the local skill with commands and observed coverage. For a repaired bug, follow the regression and CI-selection guidance in [surface requirements](../../references/surfaces.md).

Retain pure algorithm tests with meaningful edge cases. Remove mocked transport tests only after real journeys prove the same contract. A mocked expired-session response does not prove a provider's actual rejection.

A root-page response, discovered component or assertion-free test is not full coverage. Missing credentials, unavailable titles, MFA and absent devices are blocked coverage. Expected outcomes come from independent fixtures and user contracts, not the implementation being tested.

For native macOS permission onboarding, read [the native workflow](../../references/macos.md) and complete its capture-readiness steps before GUI work. The agent must inspect real journey screenshots before claiming UI acceptance. Ask the user only for an OS action they must perform. The shared driver supplies exact AX window selection, native mouse input and scoped captures. Projects own selectors and app outcomes. Run nonmutating protocol and signed-fixture checks in CI, with installed grants only in a separately authorized manual-live run.
