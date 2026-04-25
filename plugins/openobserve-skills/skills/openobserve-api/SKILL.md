---
name: openobserve-api
description: This skill should be used when user asks to "query OpenObserve", "create OpenObserve dashboard", "edit OpenObserve panel", "fetch OpenObserve logs", "run OpenObserve search", "list OpenObserve streams", "ingest into OpenObserve", or works with OpenObserve Cloud / self-hosted via REST API. Covers auth, search/SQL, streams, dashboards (CRUD + per-panel ops), the v8 panel JSON schema, and known pitfalls (re-aggregation, hash concurrency, microsecond timestamps).
license: Apache-2.0
---

# OpenObserve REST API Skill

Programmatic OpenObserve usage for AI agents. Talk to any OpenObserve instance (Cloud or self-hosted) using `curl` and the documented REST API. No CLI required — there is no first-party OpenObserve CLI.

## Retrieval First

Your knowledge of OpenObserve API shapes may be outdated. **Prefer retrieval over pre-training**:

| Source        | How to retrieve                                                                                                     | Use for                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Docs repo     | `gh api repos/openobserve/openobserve-docs/contents/docs/reference/api/{path}.md -q .content \| base64 -d`          | Authoritative request/response samples     |
| Server source | `gh api repos/openobserve/openobserve/contents/src/handler/http/request/dashboards/mod.rs -q .content \| base64 -d` | Endpoint paths, query params, status codes |
| Panel schema  | `gh api repos/openobserve/openobserve/contents/src/config/src/meta/dashboards/v8/mod.rs -q .content \| base64 -d`   | Exact panel JSON structure (Rust structs)  |

When docs and server source disagree, **trust the server source** — handlers ship faster than docs.

## 1. Auth

HTTPS basic auth with email + password. There is no token endpoint.

```bash
# Method 1: curl -u shorthand
curl -u "you@example.com:PASSWORD" "https://eu1.openobserve.ai/api/<org>/streams"

# Method 2: explicit header
TOKEN=$(printf '%s' "you@example.com:PASSWORD" | base64)
curl -H "Authorization: Basic $TOKEN" "https://eu1.openobserve.ai/api/<org>/streams"
```

Endpoints below assume `BASE=https://<host>/api/<org>` and `AUTH="-u you@example.com:PASSWORD"`.

## 2. Search / Query — `POST $BASE/_search`

Optional query string `?type=logs|metrics|traces` (default `logs`).

```bash
curl $AUTH -H 'Content-Type: application/json' \
  "$BASE/_search?type=logs" \
  -d '{
    "query": {
      "sql": "SELECT host_name, COUNT(*) AS n FROM \"my_stream\" GROUP BY host_name ORDER BY n DESC",
      "start_time": 1777000000000000,
      "end_time":   1777999999000000,
      "from": 0,
      "size": 100
    },
    "search_type": "ui"
  }'
```

- **Timestamps are microseconds** (Unix epoch × 1_000_000). Always set `start_time`/`end_time` — missing them scans everything.
- `search_type` ∈ `ui | dashboards | reports | alerts` — affects rate limits and audit logs.
- Pagination: `from` (offset) + `size` (limit, max ~10000 per request).
- Response: `{ took, hits[], total, from, size, scan_size }`.
- SQL flavor: DataFusion / Arrow SQL. Identifiers in double quotes (`"stream_name"`), strings in single quotes (`'value'`).
- Time-bucketed group by: `SELECT histogram(_timestamp, '5 minute') AS ts, COUNT(*) FROM "stream" GROUP BY ts ORDER BY ts`.
- Term aggregation: `SELECT k8s_namespace, COUNT(*) FROM "stream" GROUP BY k8s_namespace`.
- Full-text: `match_all('text')`, `str_match(field, 'text')`. Default full-text fields: `log, message, msg, content, data, json`.
- PromQL on metrics: `POST $BASE/prometheus/api/v1/query_range`.
- Trace context window: `GET $BASE/{stream}/_around?key=<ts_us>&size=N`.

## 3. Streams — `GET $BASE/streams`

```bash
# List
curl $AUTH "$BASE/streams?fetchSchema=false&type=logs"

# Schema
curl $AUTH "$BASE/streams/<stream>/schema?type=logs"

# Update settings
curl $AUTH -X PUT -H 'Content-Type: application/json' "$BASE/streams/<stream>/settings" -d '{"partition_keys":["host_name"]}'

# Delete
curl $AUTH -X DELETE "$BASE/streams/<stream>?type=logs"
```

Field types: `Utf8 | Int64 | Float64 | Timestamp | Boolean`. Timestamp field is always `_timestamp` (microseconds).

## 4. Dashboards — `GET|POST|PUT|DELETE $BASE/dashboards`

All take `?folder=<folder_id>` (default `default`).

```bash
# List
curl $AUTH "$BASE/dashboards?folder=default"

# Get one (returns versioned wrapper {v1..v8, version, hash, updatedAt})
curl $AUTH "$BASE/dashboards/<dashboard_id>?folder=default"

# Create — body is the UNWRAPPED inner v8 object
curl $AUTH -X POST -H 'Content-Type: application/json' \
  "$BASE/dashboards?folder=default" \
  -d @dashboard-v8.json

# Update — REQUIRES the current hash for optimistic concurrency
HASH=$(curl -s $AUTH "$BASE/dashboards/<id>?folder=default" | jq -r .hash)
curl $AUTH -X PUT -H 'Content-Type: application/json' \
  "$BASE/dashboards/<id>?folder=default&hash=$HASH" \
  -d @updated-dashboard.json

# Delete
curl $AUTH -X DELETE "$BASE/dashboards/<id>?folder=default"

# Move between folders
curl $AUTH -X PUT -H 'Content-Type: application/json' \
  "$BASE/folders/dashboards/<id>" \
  -d '{"from":"default","to":"<target_folder_id>"}'
```

**Critical: PUT/POST body must be the unwrapped inner v8 object**, not the full `{v1..v8, version, hash}` wrapper. The server returns the wrapper but expects you to send only the inner object back.

```bash
# Read, mutate, write — the correct pattern
RAW=$(curl -s $AUTH "$BASE/dashboards/<id>?folder=default")
HASH=$(echo "$RAW" | jq -r .hash)
echo "$RAW" | jq '.v8 | .title = "New Title"' \
  | curl -s $AUTH -X PUT -H 'Content-Type: application/json' \
    "$BASE/dashboards/<id>?folder=default&hash=$HASH" -d @-
```

A `409 Conflict` response means the hash is stale — refetch and retry.

### Per-panel operations (v8 only — return new hash)

```bash
# Add panel
curl $AUTH -X POST -H 'Content-Type: application/json' \
  "$BASE/dashboards/<id>/panels?folder=default&hash=$HASH" \
  -d '{"panel": {...}, "tabId": "default"}'

# Update panel
curl $AUTH -X PUT -H 'Content-Type: application/json' \
  "$BASE/dashboards/<id>/panels/<panel_id>?folder=default&hash=$HASH" \
  -d '{...panel...}'

# Delete panel
curl $AUTH -X DELETE \
  "$BASE/dashboards/<id>/panels/<panel_id>?folder=default&hash=$HASH&tabId=default"
```

## 5. Panel JSON (v8)

The dashboard tree: `dashboard.tabs[].panels[]`. Each panel:

```json
{
  "id": "panel-1",
  "type": "table",
  "title": "Per-host stats",
  "description": "",
  "queryType": "sql",
  "queries": [
    {
      "query": "SELECT host_name, COUNT(*) AS n FROM \"my_stream\" GROUP BY host_name ORDER BY n DESC",
      "vrlFunctionQuery": "",
      "customQuery": true,
      "fields": {
        "stream": "my_stream",
        "stream_type": "logs",
        "x": [
          { "label": "Host", "alias": "host_name", "column": "host_name", "color": null, "aggregationFunction": null }
        ],
        "y": [
          {
            "label": "Count",
            "alias": "n",
            "column": "n",
            "color": null,
            "aggregationFunction": null,
            "treatAsNonTimeseries": true
          }
        ],
        "z": [],
        "breakdown": [],
        "filter": { "filterType": "group", "logicalOperator": "AND", "conditions": [] }
      },
      "config": { "promql_legend": "", "layer_type": "scatter", "weight_fixed": 1, "limit": 0, "min": 0, "max": 100 }
    }
  ],
  "config": {
    "show_legends": true,
    "decimals": 2,
    "unit": "currency",
    "unit_custom": "USD"
  },
  "layout": { "x": 0, "y": 0, "w": 48, "h": 14, "i": 1 }
}
```

### Panel `type` values

`metric` (single big number) · `table` · `bar` · `h-bar` · `stacked` · `h-stacked` · `line` · `area` · `area-stacked` · `scatter` · `pie` · `donut` · `heatmap` · `gauge` · `geomap` · `maps` · `sankey` · `html` · `markdown`.

### Layout grid

The grid is **96 columns wide** (verified via inspection of returned panel layouts on April 2026 OpenObserve Cloud). Older docs mention 192 or 48 — when in doubt, GET an existing dashboard from the same org and copy the `w` values you see. Heights are unitless rows (`h: 7` = small metric panel; `h: 14` = standard table).

### Useful `config` keys

| Key                  | Effect                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `decimals`           | Number of decimal places for all numeric columns (0 = integers).                                                 |
| `unit`               | `numbers \| currency \| bytes \| seconds \| milliseconds \| microseconds \| nanoseconds \| percent \| percent-1` |
| `unit_custom`        | When `unit=currency`, ISO code like `USD`.                                                                       |
| `show_legends`       | Boolean, charts only.                                                                                            |
| `legends_position`   | `right \| bottom`.                                                                                               |
| `axis_border_show`   | Boolean.                                                                                                         |
| `line_interpolation` | `smooth \| linear \| step-start \| step-end`.                                                                    |
| `connect_nulls`      | Boolean — line/area only.                                                                                        |
| `top_results`        | Cap series count for line/bar (e.g. `10`).                                                                       |
| `mark_line`          | `[{name, type:'avg'\|'max'\|'min', value}]` — horizontal reference lines.                                        |

## 6. Critical pitfalls

**6a. Re-aggregation when `customQuery: true`** — the most common bug.

If your hand-written SQL already contains `COUNT(*)`, `SUM(...)`, `AVG(...)` etc., every entry in `fields.y` (and `fields.x`) **must set `aggregationFunction: null`**. Default `'sum'` causes OpenObserve to wrap the already-aggregated column in another aggregation client-side, producing **duplicate rows** and wildly inflated numbers.

```jsonc
// WRONG — produces duplicate rows
"y": [{"column":"messages", "aggregationFunction":"count"}]

// RIGHT — SQL already did the aggregation
"y": [{"column":"messages", "aggregationFunction":null, "treatAsNonTimeseries":true}]
```

**6b. Multiple `fields.y` on Table panels** — each Y entry can render as a separate series/row. For a Table that should display one row per group, put **only one entry** in `fields.y` (any one column); the renderer will then display all SQL columns as table columns.

**6c. Metric panels with `customQuery: true`** — must explicitly map the result column to `fields.y`:

```json
"y": [{"label":"Value", "alias":"value", "column":"value", "aggregationFunction":"sum", "treatAsNonTimeseries":false}]
```

The metric panel needs to know which column is the number to display.

**6d. ROUND + wildcard timestamp expansion** — OpenObserve's planner sometimes auto-injects `_timestamp` into queries that wrap `SUM(col)` in `ROUND(...)`, producing `Column "_timestamp" must appear in the GROUP BY clause` errors. Workaround: drop `ROUND()` and use the panel's `decimals` config instead, or pre-cast: `CAST(SUM(...) AS DOUBLE)`.

**6e. Hash-based concurrency on PUT** — every successful PUT changes the dashboard hash. If you mutate a dashboard from two scripts back-to-back, the second one needs to refetch. Always re-`GET` before each `PUT` to grab the current hash.

**6f. `start_time`/`end_time` are microseconds** — `Date.now() * 1000`, not milliseconds. Off-by-1000× returns no hits but no error.

## 7. Folders / alerts / ingestion

**Folders** (v2 API):

```bash
curl $AUTH "$BASE/folders/dashboards" # list
curl $AUTH -X POST "$BASE/folders/dashboards" -d '{"name":"my-folder"}'
curl $AUTH "$BASE/folders/dashboards/name/<folder_name>" # lookup by name
```

`folder_type` ∈ `dashboards | alerts | reports`.

**Alerts**:

```bash
curl $AUTH "$BASE/{stream}/alerts" # list per-stream
curl $AUTH -X POST "$BASE/{stream}/alerts" -d '{...}'
# templates and destinations are referenced by alert definitions:
curl $AUTH "$BASE/alerts/templates"
curl $AUTH "$BASE/alerts/destinations"
```

**Ingestion** (POST your own data in):

```bash
# JSON
curl $AUTH -X POST "$BASE/<stream>/_json" -d '[{"event":"foo","level":"info"}]'

# Multi-line JSON (one per line)
curl $AUTH -X POST "$BASE/<stream>/_multi" --data-binary @file.ndjson

# Elasticsearch bulk
curl $AUTH -X POST "$BASE/_bulk" --data-binary @bulk.txt

# OTLP HTTP
curl $AUTH -X POST "$BASE/v1/logs" -d @otlp-logs.json
curl $AUTH -X POST "$BASE/v1/traces" -d @otlp-traces.json
curl $AUTH -X POST "$BASE/v1/metrics" -d @otlp-metrics.json

# Loki
curl $AUTH -X POST "$BASE/loki/api/v1/push" -d @loki.json

# Prometheus remote-write (binary protobuf)
curl $AUTH -X POST "$BASE/prometheus/api/v1/write" --data-binary @write.pb
```

## 8. Common recipes

**Get top hosts by message count (last 24h)**:

```bash
NOW=$(($(date +%s) * 1000000))
DAY=$((NOW - 86400 * 1000000))
curl $AUTH -H 'Content-Type: application/json' \
  "$BASE/_search?type=logs" \
  -d "{\"query\":{\"sql\":\"SELECT host_name, COUNT(*) AS n FROM \\\"my_stream\\\" GROUP BY host_name ORDER BY n DESC\",\"start_time\":$DAY,\"end_time\":$NOW,\"size\":50}}"
```

**Add a metric panel to an existing dashboard** (single-shot, hash-aware):

```bash
DASH_ID=<dashboard_id>
HASH=$(curl -s $AUTH "$BASE/dashboards/$DASH_ID?folder=default" | jq -r .hash)
curl $AUTH -X POST -H 'Content-Type: application/json' \
  "$BASE/dashboards/$DASH_ID/panels?folder=default&hash=$HASH" \
  -d '{
    "tabId": "default",
    "panel": {
      "id": "p-cost",
      "type": "metric",
      "title": "Total cost (USD)",
      "queryType": "sql",
      "queries": [{
        "query": "SELECT SUM(CAST(cost_usd AS DOUBLE)) AS value FROM \"my_stream\"",
        "customQuery": true,
        "fields": {
          "stream":"my_stream", "stream_type":"logs",
          "x":[], "z":[], "breakdown":[],
          "y":[{"label":"Value","alias":"value","column":"value","aggregationFunction":"sum","treatAsNonTimeseries":false}],
          "filter":{"filterType":"group","logicalOperator":"AND","conditions":[]}
        },
        "config":{}
      }],
      "config": {"unit":"currency","unit_custom":"USD","decimals":2},
      "layout": {"x":0,"y":0,"w":32,"h":7,"i":99}
    }
  }'
```

**Build a complete dashboard from scratch**: GET an existing dashboard's panel JSON as a template (it's the safest way to learn the exact field shapes the server will accept), then mutate the `tabs[0].panels` array and PUT the unwrapped v8 body back. See the `references/recipes/build-dashboard.sh` script that ships with this skill for a working example.

## 9. SDKs / clients (no first-party CLI)

| Language              | Repo                                                | Status                   |
| --------------------- | --------------------------------------------------- | ------------------------ |
| Python                | `github.com/openobserve/openobserve-python-sdk`     | Active                   |
| Go                    | `github.com/openobserve/openobserve-go-client`      | ZincObserve-era, partial |
| Helm chart            | `github.com/openobserve/openobserve-helm-chart`     | Active                   |
| OTel collector distro | `github.com/openobserve/openobserve-otel-collector` | Active                   |

For most agent tasks, plain `curl` against the REST API is the right tool — the SDKs add little value over an HTTP request and lag the server feature set.

## References

- API docs (canonical): https://github.com/openobserve/openobserve-docs (path: `docs/reference/api/`)
- Server source: https://github.com/openobserve/openobserve (paths: `src/handler/http/request/`, `src/config/src/meta/dashboards/v8/mod.rs`)
- Cloud console: https://cloud.openobserve.ai (regions: us1, eu1, ap1)
- The `references/` directory in this skill mirrors selected docs from `openobserve-docs` for offline access.
