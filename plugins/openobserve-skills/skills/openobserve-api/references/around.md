---
description: >-
  Search around a specific timestamp to fetch nearby log records using GET
  /_around with forward and backward context in a 5-minute window.
---
# Search around

Endpoint: `GET /api/{organization}/{stream}/_around?key={timestamp}&size=10`

## Request

Description

| Field name | Data type | Default value | Description |
|------------|-----------|---------------|-------------|
| stream     | string    | -             | stream name |
| key        | int64     | 0             | the `_timestamp` of the record what you want to search around |
| size       | int64     | 0             | how many records do you want to response around the record, we will search the record forward & backward 5 minutes |

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
