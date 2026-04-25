---
description: >-
  Search around to fetch field values from a stream using filters like time,
  keyword, and size with the _values API endpoint.
---
# Search around

Endpoint: `GET /api/{organization}/{stream}/_values?fields={fields}&start_time={start_time}&end_time={end_time}&size=10&keyword=&no_count=false`

## Request

Description

| Field name | Data type | Default value | Description |
|------------|-----------|---------------|-------------|
| stream     | string    | -             | stream name |
| fields     | string    | -             | the fields you want to get values, `field1,field2` |
| size       | int64     | 0             | how many values do you want to response, order by values num |
| start_time | int64     | 0             | Only list the values in the time range |
| end_time   | int64     | 0             | Only list the values in the time range |
| keyword    | string    | -             | search for the values |
| no_count   | bool      | false         | set to `true` will not response count and order by the value |

## Response

```json
{
	"took": 155,
	"hits": [
		{
			"field": "field name",
			"values": [
				{
                    "zo_sql_key": "value1",
                    "zo_sql_num": 2070
                }
			]
		}
	],
	"total": 10,
	"from": 0,
	"size": 0,
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
