---
name: google-telemetry
description: This skill should be used when user asks to "check real users", "read Google Analytics", "query Search Console", "check version adoption", "compare traffic after deployment", or base a web app change on product and search telemetry through CLI or raw API calls.
---

# Google telemetry

Use `google-analytics-cli` and `google-search-console-cli` as JSON wrappers around Google's APIs. Use raw official API calls for a reporting method the CLIs lack. Keep this workflow independent of the app's framework. Do not configure MCP.

## Pick the source

- GA4 measures instrumented visits and product events. Inspect the event's caller before interpreting what it proves.
- Search Console measures Google Search exposure and clicks. It cannot identify extension versions, signed-in users or successful playback.
- Saved submissions, entitlements and completed transactions belong to the application's database. A GA submit event may fire before the write succeeds.
- Deployment status and active SHA belong to the hosting platform. Traffic cannot prove which revision is serving without a recorded version dimension.

Discover the exact property for the requested app and service. Use both services only when the question needs both. A website and its extension may use different GA properties. Confirm the stream's URL and name. Never substitute a `G-` measurement ID for the numeric GA property ID. Keep known app identifiers in that app's tracked guidance rather than this shared skill.

## Access

Run the requested service's CLI with `--version` and `--help`. Use the [setup skill](../setup/SKILL.md) for installation, authentication errors or missing property access. Reuse authorized credentials. Report authentication failures separately from empty reports. Do not print credential files, access tokens or refresh tokens.

Use aggregate read commands. The CLIs also expose write commands, but this skill does not authorize them. Do not add or remove properties, submit or delete sitemaps, create audience exports, grant access or change tracking configuration as part of reading telemetry.

## Answer the product question

1. Choose the reporting interval, metrics and filters needed to answer the question. Discover custom dimensions using `custom-dims` or `metadata` before querying them.
2. Query a bounded interval for the requested service. Keep dates, time zones, hostname, event filters and reporting identity explicit. Label partial days.
3. Query totals separately from breakdowns. User counts across rows can overlap. Do not add distinct users across days, versions or events. Use a real funnel report when sequence matters, rather than dividing unrelated event totals.
4. Check the outcome the user asked about: adoption, successful use, saved feedback or search demand. Separate install/update events, title views, filter application and actual scene skips. Request counts, page views and a successful build alone do not prove that a feature works for a viewer.
5. Report the source identifiers, requested and returned interval, filters, observed counts, relevant API metadata and the practical conclusion. Distinguish zero, not instrumented, not yet processed and inaccessible. State whether internal/test users were excluded. Do not label all users as external customers when that exclusion is unavailable.

Use the [command recipes](references/commands.md) for GA reports, realtime, version and event breakdowns, Search Console queries and URL inspection. Start with small row limits. For GA, check `rowCount` against returned rows before deciding whether to page with `--offset`. For GSC, page with `--start-row` only if needed. Its top-row and privacy limits still apply after pagination. Run a separate query without query/page dimensions for property totals.

## Use evidence around deployments

For a deployment-related request, identify the active deployed revision and deployment time from accessible source and hosting state. Capture the relevant baseline before changing the app when access is available. Compare the baseline with the available post-release interval using equivalent elapsed windows and the same filters, version dimensions and reporting identity. Select the actual success event and error source from the app, then check the same measures after release. Use realtime for delivery smoke checks and processed reports for adoption and outcome claims. Consult hosting or application error logs for failures GA does not record.

Version evidence requires a release/version event parameter or user property registered for reporting at the correct scope. A user-scoped value can change as the user updates, so prefer event-scoped release data for precise historical attribution. Do not invent a dimension or claim earlier versions had zero use because they did not send it. Changing instrumentation is a separate code change within the user's authorized scope.

GA processing, consent and ad blockers can leave gaps. Inspect sampling, thresholding, `(other)`, `(not set)`, quotas and freshness metadata when returned. Search Console's finalized data commonly lags by days and uses Pacific dates, while GA uses the property's time zone. A new deployment is too recent for an SEO-effect claim until the interval has data. Low traffic supports a limited observation, not a causal claim that the release increased conversion.

Keep any requested raw exports in the app's ignored/private output directory. Store reusable property mappings, success-event semantics and verified instrumentation gaps in existing tracked app guidance. Do not commit visitor identifiers, raw reports or credentials. Scheduling future checks requires a user request.

## API coverage

GA's Data API exposes standard, realtime, pivot, batch and alpha funnel reports. These CLIs cover the first four, plus property, stream and custom-dimension reads. Use the official `runFunnelReport` API for a true funnel. Do not substitute event-count ratios for it.

Search Console exposes Search Analytics, Sites, Sitemaps and individual URL Inspection. It does not expose the whole UI, including the Links report and bulk Page Indexing report. Individual URL inspection is read-only and does not request indexing. Neither a custom wrapper nor browser sign-in creates missing API endpoints or API credentials.

Sources: [GA Data API](https://developers.google.com/analytics/devguides/reporting/data/v1), [funnels](https://developers.google.com/analytics/devguides/reporting/data/v1/funnels), [Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index), [GSC query limits](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).
