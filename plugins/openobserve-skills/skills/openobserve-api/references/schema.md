---
description: >-
  Retrieve schema, stats, and settings for a log, metric, or trace stream in
  OpenObserve via GET API. Includes timestamps, field types, and storage info.
---
# Get schema for stream

Endpoint: `GET /api/{organization}/streams/{stream}/schema?type={StreamType}`

## Request

- type: logs / metrics / traces

    default is `logs`.

## Response

```json
{
    "name": "k8s",
    "storage_type": "s3",
    "stream_type": "logs",
    "stats": {
        "doc_time_min": 1673715046856933,
        "doc_time_max": 1673849134852901,
        "doc_num": 3300000,
        "file_num": 16,
        "storage_size": 3323.5,
        "compressed_size": 11.42
    },
    "schema": [
        {
            "name": "_timestamp",
            "type": "Int64"
        },
        {
            "name": "kubernetes.annotations.kubernetes.io/psp",
            "type": "Utf8"
        },
    ],
    "settings": {
        "partition_keys": {},
        "full_text_search_keys": ["log"]
    }
}
```

Description

| Field name | Data type | Default value | Description |
|------------|-----------|---------------|-------------|
| name       | string    | -             | stream name |
| storage_type | string  | -             | s3 / disk   |
| stream_type | string   | logs          | logs / metrics / traces |
| stats      | object    | -             | stats for the stream |
| stats.doc_time_min | int64 | 0         | the minimum timestamp of the record in the stream |
| stats.doc_time_max | int64 | 0         | the maximum timestamp of the record in the stream |
| stats.doc_num      | int64 | 0         | the records num of the stream |
| stats.file_num     | int64 | 0         | the files num in storage of the stream |
| stats.storage_size | int64 | 0         | ingestion data size of the original data |
| stats.compressed_size | int64 | 0      | stored size in storage after compression |
| schema     | array     | -             | the schema of the stream, if `fetchSchema` set to false, has no this field |
| schema.name | string   | -             | field name |
| schema.type | string   | -             | field data type: Utf8 / Int64 / Float64 / Timestamp / Boolean |
| settings   | object    | -             | settings of the stream |
| settings.partition_keys | object | -   | custom partition keys for the stream. By default OpenObserve uses timestamp as the first level partition key |
| settings.full_text_search_keys | array[string] | - | full text search fields, default OpenObserve uses `log`, `message`, `msg`, `content`, `data`, `json`, if there is no those fields in your stream, will report error: `you should set the full text search fields`. |
