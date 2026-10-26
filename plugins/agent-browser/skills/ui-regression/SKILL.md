---
name: ui-regression
description: This skill should be used when the user asks to "verify UI changes", "audit UI quality", "test every screen and action", "run regression QA", "check a deployed UI", or "validate an extension release". Test known web and browser-extension workflows on localhost, staging, or production with action coverage, recovery, localization, accessibility, and real integration evidence. Use dogfood for open-ended bug discovery.
---

# UI Regression

Verify that the requested UI works from entry to outcome. Cover the changed surface and its dependencies, without expanding a small edit into an unrelated product audit.

Use the browser tools available and permitted in the current environment. When using the agent-browser CLI, read [its skill](../agent-browser/SKILL.md) first. This workflow does not require a particular browser driver or local source access.

## Scope and evidence

- Identify the target URL or extension build, environment, affected screens, actions, roles, locales, and dimensions. Inspect source and API contracts when available. For deployed-only QA, derive coverage from visible navigation and the requested workflows.
- Keep a compact coverage ledger in working notes or an existing artifact: screen/state, expected outcome, observed result and evidence. Track functional behavior, rendered quality and runtime health separately as pass/fail/unverified/not-applicable. Inventory before testing and update as results arrive; passing interactions cannot approve unchecked visuals.
- Confirm the effective URL after navigation, candidate revision or deployed version, browser, viewport, device pixel ratio, data source and build mode. Verify runner overrides take effect before exercising a local candidate. Mark unknown revisions explicitly. Compare baselines at matching content, state and dimensions.
- When asked to test every function, account for every inventoried action. Do not silently omit blocked checks or impose an arbitrary bug-count stopping point.

## Real behavior and safe boundaries

- Exercise the actual UI, API, and persistence together against an authorized environment. A mocked UI test plus a direct endpoint test does not prove their integration.
- Use fixtures or an isolated test environment to reproduce loading, empty, failure, and recovery states. Do not inject failures into production. Keep fixture results separate from live integration and packaged-extension results. Never present simulated playback as real third-party playback.
- Use dedicated test accounts and test-mode resources for side effects. Existing task authorization still applies. QA alone does not authorize payments, emails, production mutations, or broader access. Prefer read-only deployed checks unless the requested workflow authorizes more.
- If credentials, browser capabilities, source access, or external dependencies block a check, record the exact boundary. Continue independent checks. Never bypass browser protections or substitute a mock to claim a pass.

## Actions and recovery

- Within the authorized side-effect boundaries, click each affected button, link, menu item, toggle, and submit control. Verify its destination or persisted result. For new-tab links, inspect the new tab and redirects rather than judging the unchanged opener.
- Exercise applicable loading, empty, success, failure, and retry states. Check that busy controls prevent duplicate submissions, retries recover, and success follows confirmation. Deliberately failing a request should not leave the page stuck loading.
- For search/filter changes, exercise initial state, a single character, a matching query, no results and clear/reset. Check matching items, result count and recovery, plus the intended behavior of surrounding artwork and controls. Define what should persist from the product contract rather than assuming every page keeps its hero.
- For forms/preferences, test validation, save failure/retry, cancel and Escape, reopening, reload persistence, and preservation of unrelated values. Cover defaults and deselect-all where supported.
- For auth changes, cover signed-out, signed-in, expired-session, sign-out failure/retry, and account switching. Verify protected actions enforce access and account changes do not reuse another user's data.
- For changed credit, quota, or request behavior, verify ownership, fresh versus repeated actions, exhaustion, unlimited access, and duplicate submissions. Use an isolated test backend for failure injection and access-control probes. Do not enumerate or alter real users' records.
- Check relevant direct entry, refresh, back/forward navigation, interruption, and repeated actions. Stop retrying once the failure is understood, especially when requests can create side effects.

## Language, layout, and feedback

- Test every in-scope screen in each supported locale, including transient labels and errors. Check language detection/fallback, localized destinations, natural copy, and mixed-language strings.
- Choose narrow, medium, and wide dimensions appropriate to the surface, including actual popup dimensions for extensions. Inspect wrapping, overflow, scroll access, and long labels.
- Wait for relevant images to decode before screenshots, then open and inspect the captures, including focused crops. Compare layout, spacing, typography, colors and brand artwork at normal size and high display density when affected. A saved screenshot or successful image request alone is insufficient visual evidence.
- For logos/icons, prefer genuine vector artwork when available and inspect SVGs for embedded bitmaps. For raster assets, compare intrinsic dimensions with rendered CSS size × device pixel ratio; inspect sharpness, proportions and crop. This does not require converting photos or posters to SVG.
- For text inputs, inspect empty, typed, focused and cleared states. Measure contrast against the rendered background and visually check the text, placeholder, caret and focus treatment. Apply the relevant accessibility threshold and report when transparency or complex backgrounds prevent a reliable computed measurement.
- For other media, check loading, status/type, dimensions, aspect ratio and playback when affected.
- Exercise keyboard order, focus visibility, accessible names, dialog focus containment/restoration, Escape, and an automated accessibility scan when supported. Check pressed/loading/success/error feedback and reduced motion. Report scan limitations separately from manual checks.
- Inspect console and network errors, failed assets, redirects, and unexpected 4xx/5xx responses. Distinguish intentional failures from regressions. Verify the browser has loaded the current candidate before attributing stale UI to a code defect.

## Browser extensions

Apply these checks only to affected extension behavior.

- Load the production build in a supported browser. Exercise the popup, background/service worker, content script, messaging, storage, and host permissions involved. A localhost component preview does not validate extension APIs or browser permissions.
- Check popup close/reopen, extension reload, service-worker restart, and account-change messages where relevant. Verify listeners, timers, and injected UI do not duplicate.
- For player UI, test in-site title navigation, video-element replacement, fullscreen entry/exit, dismissal and intended reopening, dialog pause/resume, and saved filters across titles/accounts. Verify playback effects in the actual player when accessible.
- Inspect the release archive for the intended version, localized metadata, root manifest, referenced assets, and production origins. Exclude QA fixtures, credentials, nested archives, development loaders, and localhost references.

## Finish against the tested candidate

- For local changes with source access, run the repository's clean install, applicable tests/lint/type checks, and production build. Test production output when bundling, dependencies, environment, or rendering changed. Deployed-only QA does not require a local checkout or rebuild.
- After a fix, rerun the failed case and affected neighboring flows against the final candidate. Tie evidence to that version. Do not reuse earlier screenshots as proof of later changes.
- Fix within the authorized scope, otherwise report reproducible findings with expected/actual behavior and evidence. A request to inspect a deployed UI does not itself authorize edits or deployment.
- If deployment is requested, resolve release-blocking failures first, then verify the deployed revision, relevant routes, and service health. Check persistent storage/domain bindings when the change or hosting upgrade affects them. A push or healthy root page alone is not deployment proof.
- Report separate functional, rendered-quality and runtime verdicts with evidence tied to the final candidate. Keep blocked/unverified checks separate from passes and distinguish automated assertions from visual inspection. Include relevant commands, versions, locales, viewports and remaining risk; a build or runner exit code cannot stand in for the UI audit.
- Keep evidence outside release assets. Exclude task-created QA fixtures from shipping output without deleting existing source fixtures and reset only browser overrides/sessions created for this work. Preserve user tabs and unrelated work.
