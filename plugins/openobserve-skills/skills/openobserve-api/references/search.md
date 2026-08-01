---
title: Search API | OpenObserve
description: >-
  Search logs with SQL using POST /api/{org}/_search. Filter by time, size, and
  conditions. Supports full text, aggregations, and custom functions.
---
# Search

Endpoint: `POST /api/{organization}/_search`

Replace `{stream}` in the SQL examples below with your stream name (e.g. `default`).

## Request

```json
{
    "query": {
        "sql": "SELECT * FROM {stream} WHERE [condition]",
        "start_time": 1674789786006000,
        "end_time": 1674789786006000,
        "from": 0,
        "size": 0
    },
    "search_type": "ui",
    "timeout": 0
}
```

Description

| Field name | Data type | Default value | Description |
|------------|-----------|---------------|-------------|
| query      | object    | -             | query params |
| query.sql  | string    | -             | use SQL query data, and filter data by `start_time` and `end_time`, and default order by _timestamp, you can use order by override order, and fetch offset limit by `form` and `size` |
| query.start_time | int64 | 0           | unit: microseconds, filter data by time range, you need always provide this value |
| query.end_time   | int64 | 0           | unit: microseconds, filter data by time range, you need always provide this value |
| query.from | int64     | 0             | offset in SQL |
| query.size | int64     | 0             | limit in SQL  |
| search_type | string   | -             | default is empty, support: `ui`, `dashboards`, `reports`, `alerts` |
| timeout    | int       | 0             | default value based on `ZO_QUERY_TIMEOUT=600` |
| agent_options | object    | -             | options for agent/MCP clients |
| agent_options.mode | string | `default` | query execution mode: `default` (result cache path) or `partition` (streaming partition loop, see below) |
| agent_options.output_format | string | `json` | response format for hits: `json`, `csv`, or `md_table` |

## Response

```json
{
	"took": 155,
	"hits": [
		{
			"_p": "F",
			"_timestamp": 1674213225158000,
			"kubernetes": {
				"annotations": {
					"kubernetes": {
						"io/psp": "eks.privileged"
					}
				},
				"container_hash": "dkr.ecr.us-west-2.amazonaws.com/ziox@sha256:3dbbb0dc1eab2d5a3b3e4a75fd87d194e8095c92d7b2b62e7cdbd07020f54589",
				"container_image": "dkr.ecr.us-west-2.amazonaws.com/ziox:v0.0.3",
				"container_name": "ziox",
				"docker_id": "eb0983bdb9ff9360d227e6a0b268fe3b24a0868c2c2d725a1516c11e88bf5789",
				"host": "ip.us-east-2.compute.internal",
				"labels": {
					"app": "ziox",
					"controller-revision-hash": "ziox-ingester-579b7767cf",
					"name": "ziox-ingester",
					"role": "ingester",
					"statefulset": {
						"kubernetes": {
							"io/pod-name": "ziox-ingester-0"
						}
					}
				},
				"namespace_name": "ziox",
				"pod_id": "35a0421f-9203-4d73-9663-9ff0ce26d409",
				"pod_name": "ziox-ingester-0"
			},
			"log": "[2023-01-20T11:13:45Z INFO  actix_web::middleware::logger] 10.2.80.192 \"POST /api/demo/_bulk HTTP/1.1\" 200 68 \"-\" \"go-resty/2.7.0 (https://github.com/go-resty/resty)\" 0.001074",
			"stream": "stderr"
		}
	],
	"total": 27179431,
	"from": 0,
	"size": 1,
	"scan_size": 28943
}
```

Response description:

Description

| Field name | Data type | Default value | Description |
|------------|-----------|---------------|-------------|
| took       | int64     | -             | unit: milliseconds, query execute time |
| from       | int64     | 0             | value from `query.from` |
| size       | int64     | 0             | value from `query.size` |
| scan_size  | int64     | 0             | unit: MB, it response the data size scale when execute the query. |
| hits       | array     | -             | records for query, each record is a log row what you ingested. |


## Agent options

### `output_format`

Controls how hits are formatted in the response. Useful for agent/MCP clients that pay per token.

| Value       | Description |
|-------------|-------------|
| `json`      | Default. Hits returned as a JSON array of objects. |
| `csv`       | Tabular hits as a compact CSV block (~40% fewer tokens than JSON). |
| `md_table`  | Tabular hits as a Markdown table. Best for small result sets. |

### `mode: partition`

Set `agent_options.mode` to `partition` to run search through the streaming backend pipeline. The server scans time partitions one by one and stops early once enough rows are collected, which reduces data scanned for top-N queries. For aggregation queries, the server accumulates reusable cache partition by partition, so repeated queries against shifting time windows hit progressively warmer cache instead of invalidating a monolithic entry.

This mode is designed for agent/MCP clients that speak plain request-response and cannot consume SSE — it exposes the same partitioned execution that the streaming `_search_stream` endpoint uses, collected into a single response.

| Value       | Description |
|-------------|-------------|
| `default`   | (default) Single search through the result cache path. Behavior is byte-for-byte unchanged. |
| `partition` | Partitioned execution with per-partition early termination and streaming-agg caching, collected into one response. |

**Key behaviors in partition mode:**

- **Early termination**: scanning stops once the query has enough rows; useful for `SELECT ... LIMIT 100`-style queries scanning a wide time range.
- **Progressive aggregation cache**: aggregation queries (histogram, term counts, etc.) build up the streaming-agg cache partition by partition, so follow-up queries with similar time windows reuse cached work.
- **Cancellation**: if the HTTP client disconnects (drops the request), the per-partition loop stops — you are not billed for scanning partitions you never see.
- **No SSE required**: the response is a plain JSON `Response` identical in shape to `default` mode, with all hit pages and scan counters folded together.

**When to use partition mode:**

- Your client cannot consume SSE (MCP tools, REST clients, curl-based scripts).
- You are scanning a large time range but only need a few rows (top-N or sample).
- You run exploratory queries that shift their time window with each call — the progressive cache rewards this pattern.
- **Do NOT** split the time range yourself and call `_search` in a loop. Let the server do it with one call in `partition` mode.

## SQL Syntax

Please refer to [PostgreSQL](https://www.postgresql.org/docs/current/sql-syntax.html) for SQL Syntax.

Notes:

- We have a build-in time field, `_timestamp` you can use it to do time range filter.
- Field name can not start with `@`.
- Field name can use double quote or without quote.
- Field integer value without quote.
- Field string value must use single quote.

## Limitation

- You should give a time range for each query or it will scan all data, it is a very expensive operate.


## Examples

Here list some common examples, if you want more example please create a issue tell us, we will add it.

### Query latest 10 record logs

```json
{
    "query": {
        "sql": "SELECT * FROM {stream}",
        "start_time": 1674789786006000,
        "end_time": 1674789786006000,
        "from": 0,
        "size": 10
    }
}
```

### Query latest 10 record logs with filter

```json
{
    "query": {
        "sql": "SELECT * FROM {stream} WHERE kubernetes.namespace_name='default' AND code=200 ",
        "start_time": 1674789786006000,
        "end_time": 1674789786006000,
        "from": 0,
        "size": 10
    }
}
```

### Full text query

```json
{
    "query": {
        "sql": "SELECT * FROM {stream} WHERE match_all('err') ",
        "start_time": 1674789786006000,
        "end_time": 1674789786006000,
        "from": 0,
        "size": 10
    }
}
```

### Match on a field (log)

```json
{
    "query": {
        "sql": "SELECT * FROM {stream} WHERE str_match(log, 'err') ",
        "start_time": 1674789786006000,
        "end_time": 1674789786006000,
        "from": 0,
        "size": 10
    }
}
```

### Histogram aggregation (full mode)

```json
{
    "query": {
       "sql": "SELECT histogram(_timestamp, '5 minute') AS key, COUNT(*) AS num FROM {stream} GROUP BY key ORDER BY key LIMIT 10 OFFSET 1",
        "start_time": 1674789786006000,
        "end_time": 1674789786006000
    }
}
```

### Term aggregation (full mode)

```json
{
    "query": {
       "sql": "SELECT kubernetes.namespace_name AS namespace, COUNT(*) AS num FROM {stream} GROUP BY namespace ORDER BY namespace",
        "start_time": 1674789786006000,
        "end_time": 1674789786006000
    }
}
```

### Use custom functions 

```json
{
    "query": {
       "sql": "SELECT *, my_func(log) as mykey FROM {stream}",
        "start_time": 1674789786006000,
        "end_time": 1674789786006000,
        "from": 0,
        "size": 10
    }
}
```

### Partition mode with CSV output

Run a top-N query across a wide time window with partition mode, returning hits as compact CSV:

```json
{
    "query": {
        "sql": "SELECT * FROM {stream} WHERE code=500 ORDER BY _timestamp DESC",
        "start_time": 1674000000000000,
        "end_time": 1675000000000000,
        "from": 0,
        "size": 50
    },
    "agent_options": {
        "mode": "partition",
        "output_format": "csv"
    }
}
```

With `mode: partition`, the server scans partitions one by one and stops early once it has 50 rows, instead of scanning the full time range through the cache path.

### Partition mode for aggregation

```json
{
    "query": {
        "sql": "SELECT kubernetes_namespace_name, COUNT(*) AS cnt FROM {stream} GROUP BY kubernetes_namespace_name ORDER BY cnt DESC LIMIT 10",
        "start_time": 1674000000000000,
        "end_time": 1675000000000000
    },
    "agent_options": {
        "mode": "partition"
    }
}
```

Each partition's aggregation result accumulates into a progressively merged cache entry. Follow-up queries with slightly shifted time windows reuse that cached work.

## Error Responses

When a search request fails, the API returns a standard error body. For certain error codes, the response includes **self-correcting guidance** to help you (or an AI agent) fix the query without manual investigation.

### Error Response Body

| Field name   | Data type     | Always present | Description |
|-------------|---------------|----------------|-------------|
| code         | int           | yes            | Numeric error code (see below) |
| message      | string        | yes            | Human-readable problem description |
| error_detail | string        | no             | Raw technical detail (omitted when `hint`/`suggestions` are present) |
| hint         | string        | no             | One-line guidance on how to fix the error |
| suggestions  | array[string] | no             | Closest valid alternatives (up to 3), ranked by similarity |

The `hint` and `suggestions` fields appear only when the server has enough information to offer useful guidance. Existing clients that ignore these optional fields are unaffected.

### Field Not Found (`code: 20004`)

When you reference a field that doesn't exist in the stream schema:

```json
{
  "code": 20004,
  "message": "unknown field 'servce'",
  "suggestions": ["service"]
}
```

The `suggestions` list contains the closest matching field names ranked by edit distance. If no close match is found, `hint` provides a fallback:

- **Small schemas** (10 fields or fewer): the `hint` lists all valid fields.
- **Large schemas**: the `hint` directs you to use the [stream schema endpoint](../stream/schema.md).
- **UDS violations** (the field exists in the raw stream but not in the User-Defined Schema): the `hint` explains that the field is excluded by the UDS and suggests adding it in stream settings.

### Function Not Defined (`code: 20005`)

When you call a function that doesn't exist:

```json
{
  "code": 20005,
  "message": "unknown function 'str_mach'",
  "hint": "usage: str_match(field, 'v')",
  "suggestions": ["str_match", "str_match_ignore_case"]
}
```

Suggestions cover both OpenObserve UDFs and DataFusion built-in functions. When a top suggestion is found, the `hint` carries a usage example for the closest match.

### Other Error Codes

| Code  | Name                          | Description |
|-------|-------------------------------|-------------|
| 20001 | `ServerInternalError`         | Internal server error |
| 20002 | `SearchSQLNotValid`           | SQL syntax is invalid |
| 20003 | `SearchStreamNotFound`        | Stream does not exist |
| 20004 | `SearchFieldNotFound`         | Field name not found (with suggestions) |
| 20005 | `SearchFunctionNotDefined`    | Function name not found (with suggestions) |
| 20008 | `SearchSQLExecuteError`       | SQL execution failed |
| 20009 | `SearchCancelQuery`           | Query was cancelled |
| 20010 | `SearchTimeout`               | Query timed out |
| 20011 | `InvalidParams`               | Invalid request parameters |
| 20012 | `RatelimitExceeded`           | Rate limit exceeded |
| 20013 | `SearchHistogramNotAvailable` | Histogram data unavailable |

## Next steps

- [Example queries](../../../user-guide/data-exploration/example-queries.md): copy-paste SQL examples to try.
- [Full-text search functions](../../sql-functions/full-text-search.md): `match_all`, `str_match`, `re_match`, and friends.
- [Logs UI](../../../user-guide/data-exploration/logs/logs.md): run these queries interactively.

**Need some help?**

- Join our [Community Slack](https://short.openobserve.ai/community) 
- Or [Contact support](https://openobserve.ai/contactus/)

