# Reporting recipes

Replace example property IDs, dates and domains. Use JSON stdout and inspect the CLI exit code. These commands read data. Keep the raw API metadata when summarizing results.

## Discover the app

```bash
google-analytics-cli accounts
google-analytics-cli property 123456789
google-analytics-cli data-streams 123456789
google-analytics-cli custom-dims 123456789
google-search-console-cli sites
```

Use `metadata` to find exact standard/custom reporting names and `check-compatibility --dimensions ... --metrics ...` when a combination is uncertain. Do not dump the whole metadata response when a targeted lookup suffices.

## Daily activity and events

```bash
google-analytics-cli report 123456789 \
  --dimensions date \
  --metrics activeUsers,totalUsers,sessions,eventCount \
  --date-ranges '[{"startDate":"2026-10-17","endDate":"2026-10-23"}]' \
  --limit 100 --return-property-quota

google-analytics-cli report 123456789 \
  --dimensions eventName \
  --metrics eventCount,totalUsers \
  --date-ranges '[{"startDate":"2026-10-17","endDate":"2026-10-23"}]' \
  --limit 100 --return-property-quota
```

For whole-interval totals, use a `batch-report` request with no dimensions. Do not add daily distinct users:

```bash
google-analytics-cli batch-report 123456789 \
  --requests '[{"dateRanges":[{"startDate":"2026-10-17","endDate":"2026-10-23"}],"metrics":[{"name":"activeUsers"},{"name":"totalUsers"},{"name":"sessions"},{"name":"eventCount"}],"returnPropertyQuota":true}]'
```

`batch-report` accepts at most five report requests. `report` pagination uses `--limit` and `--offset`. Filter website reports with `hostName` if the property receives several hosts.

## Versions and outcomes

After confirming a custom user dimension named `extension_version` exists:

```bash
google-analytics-cli report 123456789 \
  --dimensions customUser:extension_version,eventName \
  --metrics totalUsers,eventCount \
  --date-ranges '[{"startDate":"2026-10-22","endDate":"2026-10-24"}]' \
  --dimension-filter '{"filter":{"fieldName":"customUser:extension_version","stringFilter":{"matchType":"EXACT","value":"1.0.9"}}}' \
  --limit 100 --return-property-quota
```

The dimension and version are examples, not defaults for other apps. For an event-scoped release parameter, use its discovered `customEvent:` name. Registered dimensions may not cover earlier events. Query event names and parameters used by the actual app rather than assuming `purchase`, `playback_started` or `form_submit` exists or represents success.

```bash
google-analytics-cli realtime 123456789 \
  --dimensions eventName --metrics activeUsers,eventCount \
  --limit 50 --return-property-quota
```

Realtime has a smaller dimension/metric catalog than core reports. Check its schema rather than sending every core custom dimension. The current CLI does not expose alpha funnels. For ordered journeys use Google's [runFunnelReport](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1alpha/properties/runFunnelReport) via an authorized raw request, or state that a true funnel was not queried. Independent event counts are not an ordered funnel.

## Search totals, dates, queries and pages

```bash
google-search-console-cli query sc-domain:example.com \
  --start-date 2026-10-17 --end-date 2026-10-23 \
  --type web --data-state final

google-search-console-cli query sc-domain:example.com \
  --start-date 2026-10-17 --end-date 2026-10-23 \
  --dimensions date --type web --data-state final --row-limit 100

google-search-console-cli query sc-domain:example.com \
  --start-date 2026-10-17 --end-date 2026-10-23 \
  --dimensions query --type web --data-state final --row-limit 100

google-search-console-cli query sc-domain:example.com \
  --start-date 2026-10-17 --end-date 2026-10-23 \
  --dimensions page --type web --data-state final --row-limit 100
```

The first call returns property totals without a dimension. Query rows exclude anonymized queries and need not sum to those totals. Page grouping changes aggregation too. Do not average row CTR or position values to reconstruct the property's weighted metrics. To page, add `--start-row 100` with the same row limit, dates and filters. Google's limit is 25,000 rows per request. `--all` auto-paginates but does not guarantee every Google row and drops freshness metadata in this CLI's combined result. Prefer explicit pages when freshness matters.

Use `--data-state all` for fresh data only when partial results are useful and labeled. Dates use Search Console's Pacific time zone. Query by date to discover the returned interval instead of assuming the requested end date is finalized.

## Index state and sitemaps

```bash
google-search-console-cli inspect sc-domain:example.com https://example.com/en
google-search-console-cli sitemaps sc-domain:example.com
```

Inspect only relevant URLs because URL Inspection has a separate quota. These are Google's recorded index state and sitemap reads. They neither test a live rendered page nor request indexing. Bulk Page Indexing and Links UI reports have no equivalent endpoint in the documented Search Console API.
