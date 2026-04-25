---
description: >-
  Search logs with SQL using POST /api/{org}/_search. Filter by time, size, and
  conditions. Supports full text, aggregations, and custom functions.
---
# Search

Endpoint: `POST /api/{organization}/_search`

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


## SQL Syntax

Please refer to [PostgreSQL](https://www.postgresql.org/docs/current/sql-syntax.html) for SQL Syntax.

Something need highlighted:

- We have a build-in time field, `_timestamp` you can use it to do time range filter.
- Field name can not start with `@`.
- Field name can use double quote or without quote.
- Field integer value without quote.
- Field string value must use single quote.

## Limitation

- You should give a time range for each query or it will scan all data, it is a very expensive operate.


## Examples

Here list some common examples, if you want more example please create a issue tell us, we will add it.

### Query latest 10 record logs with histogram aggregation

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

### Match on a filed (log)

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
