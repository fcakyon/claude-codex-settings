---
name: frontend-testing-debugging
description: This skill should be used when user asks to "debug this UI", "verify a rendered frontend change", or "check responsive layouts". Diagnose visual and interaction problems, compare reference screenshots, and reuse project QA journeys when available.
---

# Frontend testing and debugging

Own the visual diagnosis and fix loop. Reuse project testing infrastructure for repeatable execution, sessions and reports. This skill works independently of the QA plugin.

## Choose the flow and execution path

1. Identify the entry route, user action and expected visible result. Inspect repository scripts and running servers before asking for a missing URL. Keep the requested host exact.
2. Read project testing guidance and look for an existing journey covering the change. Run that journey first. When the QA plugin and project configuration are available, follow the project's QA skill and use `qa:run-qa` for execution, session recovery, telemetry isolation and cleanup.
3. Without project QA journeys, use the repository's existing browser or e2e workflow. For interactive investigation, choose an available browser tool and read its current instructions. Do not assume a particular plugin or API exists. Respect the user's browser preference and avoid taking focus during background work.
4. If no suitable workflow exists, use a temporary diagnostic script outside committed source. Add dependencies only when required by the task and permitted by the user. Report unavailable access or runtime support as a specific limitation.

Interactive inspection is useful for new visual issues and failed journeys. It does not replace a failing regression with an easier smoke check. Before visiting production, use the project's analytics isolation and test-account rules. If those are absent, prefer a local or staging target for diagnostic traffic.

## Inspect, fix and verify

Confirm the intended URL and meaningful rendered content. Check relevant console errors and framework overlays before diagnosing layout. Exercise the target interaction and observe its result through visible state, navigation or persisted application behavior.

For rendered validation, use the installed `ui-regression` skill when available. It owns state coverage, input contrast, asset density, screenshot inspection and the separate functional, rendered-quality and runtime verdicts. Keep investigation here and reuse the project runner for executable checks.

Without that skill, inspect desktop/mobile screenshots after media loads, exercise typed and cleared inputs, check contrast and asset sharpness at the target display density, and verify the intended surrounding layout across search results and empty states. Keep reference comparisons at matching state and viewport. Mark uninspected visuals as unverified.

When text changes unexpectedly between locales or screens, trace the source value through translation, formatting, Unicode normalization, JavaScript casing and CSS to the rendered result. Inspect inherited `lang`, text direction, font coverage and clipping where relevant. Distinguish translated interface copy from names, titles and identifiers whose spelling must survive presentation. Fix the owning transformation or layout rule instead of replacing individual characters, stripping accents, or forcing the whole page to one language. Use the actual content language for intentional transformations and locale formatting.

Make the smallest relevant edit, reload or rebuild as needed, and repeat the original failing interaction. Rerun affected project journeys. A passing build or root-page screenshot does not prove the interaction works.

Move repeatable discoveries into the existing tracked QA or e2e suite, with assertions on user-visible outcomes. Reuse its helpers instead of adding a second browser/session runner. When the QA plugin is available but the project has no suite, use `qa:setup` if creating repeatable coverage is within the task. Keep one-off diagnostic scripts and generated evidence outside Git.

## Evidence and cleanup

Report findings or verified behavior, the target URL and viewports, evidence supporting the result, and remaining gaps. Include screenshots when they prove visual changes. Distinguish automated journey results from interactive observations. Scale the response to the change rather than filling a fixed report template.

Close only task-created tabs and sessions, stop task-owned preview servers, and reset viewport overrides. Preserve unrelated tabs and saved authentication. Follow the project's evidence storage rules and do not create standalone reports unless requested.

## Related skills

Use `openai-frontend-design` for design creation or fidelity to an accepted concept. Use the installed React best-practices skill for relevant React/Next.js changes. Image generation is only needed when the task calls for new or revised visual assets.
