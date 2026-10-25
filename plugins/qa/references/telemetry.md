# Keep QA out of user metrics

Default browser mode captures analytics locally. Configure `telemetry.urls` for direct GA collection and every application-owned relay. Interception starts before extension loading or application navigation. Other requests remain real. A real Chrome extension and HTTP server verify that startup events never reach the server across repeated runs with saved cookies.

Reports retain event names and parameter names, not client IDs, tokens or raw bodies. `deliveryVerified: false` distinguishes emission from GA ingestion. This is the only intentionally replaced transport in ordinary live browser QA.

Inspect website, extension, backend and proxies for emitters. Browser interception cannot stop server-originated analytics, emails, billing or jobs. Disable those sinks in disposable environments or handle an explicit test marker at the server emission point. Unknown relays are not proven isolated.

For telemetry delivery checks, use a separate GA property or verified developer-traffic exclusion. Send `debug_mode` from every emitter, including Measurement Protocol. Validate the filter in Testing state before Active. Active exclusions permanently discard matching incoming data. Inspect tests in DebugView or a QA property, not production reports.

A report comparison only hides rows in that view. IP rules can exclude real users on shared networks and miss roaming testers. GA user permissions do not identify application testers.

Search Console measures search visibility and clicks. Direct application tests should navigate directly, not repeatedly search and click Google results. GA filters do not control Search Console metrics.

Reference: [Google developer traffic filters](https://support.google.com/analytics/answer/13296662).
