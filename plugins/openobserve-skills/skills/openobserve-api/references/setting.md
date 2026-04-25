---
description: >-
  Create or update OpenObserve stream settings via API. Configure partitions,
  index fields, full-text search keys, retention, and more.
---
## Set or Update Stream Settings

You can configure settings for a stream at creation time or update them later. Use the same endpoint with different HTTP methods depending on the operation.

## Create Stream Settings

Use this operation to define stream settings when creating a stream.

### Endpoint
```
POST /api/{org_id}/streams/{stream_name}/settings
```
### Request Body

Use the `StreamSettings` schema. All fields are optional.

```json
{
  "partition_keys": ["k8s_cluster", "k8s_namespace_name"],
  "index_fields": ["k8s_pod_name", "k8s_container_name"],
  "full_text_search_keys": ["body"],
  "bloom_filter_fields": ["k8s_node_name"],
  "data_retention": 30,
  "flatten_level": 1,
  "defined_schema_fields": [
    "body",
    "k8s_cluster",
    "k8s_pod_name",
    "k8s_app_component",
    "log_file_path",
    "service_name",
    "service_version",
    "severity"
  ],
  "max_query_range": 30,
  "store_original_data": true,
  "approx_partition": false,
  "extended_retention_days": [],
  "index_original_data": false,
  "index_all_values": false
}

```
### Response
```
{
  "code": 200
}
```

## Update Stream Settings
Use this operation to partially update an existing stream’s settings.

### Endpoint

```
PUT /api/{org_id}/streams/{stream_name}/settings
```
### Request Body

Use the `UpdateStreamSettings` schema. Fields that support `add`, `remove`, or `set` use wrapper syntax.

```json
{
  "partition_keys": {
    "set": ["k8s_cluster", "k8s_namespace_name"]
  },
  "full_text_search_keys": {
    "set": ["body"]
  },
  "index_fields": {
    "set": ["k8s_pod_name", "k8s_container_name"]
  },
  "bloom_filter_fields": {
    "set": ["k8s_node_name"]
  },
  "data_retention": 30,
  "flatten_level": 1,
  "defined_schema_fields": {
    "set": [
      "body",
      "k8s_cluster",
      "k8s_pod_name",
      "k8s_app_component",
      "log_file_path",
      "service_name",
      "service_version",
      "severity"
    ]
  },
  "max_query_range": 120,
  "store_original_data": true,
  "approx_partition": false,
  "extended_retention_days": {
    "add": []
  },
  "index_original_data": false,
  "index_all_values": false
}

```

### Response
```
{
  "code": 200
}
```

## Field Description
### StreamSettings Field Reference

| Field name                | Description                                                                                                                                                                       |
|---------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `partition_keys`          | Fields used to create data partitions, shown as `keyValue` or `Hash bucket` in the UI. Improves read performance by skipping unrelated files. Does not make the field searchable. |
| `index_fields`            | Fields to create secondary indexes for exact-match filters. Improves query performance on `field = value`.                                                                        |
| `full_text_search_keys`   | Fields tokenized for full-text search. Required for substring or `match_all` queries. Defaults to common log fields if not set.                                                   |
| `bloom_filter_fields`     | Fields with high-cardinality values to optimize rare value searches. Improves performance by skipping non-matching data blocks.                                                   |
| `data_retention`          | Number of days to retain data in the stream. Minimum is 3 days. Overrides the global retention setting.                                                                           |
| `flatten_level`           | Maximum depth for flattening nested JSON objects into fields. Helps expose nested keys for querying.                                                                              |
| `defined_schema_fields`   | Fields to retain in the user-defined schema. Others are excluded or stored as raw if `store_original_data` is true.                                                               |
| `max_query_range`         | Maximum time range in hours for a single query. Prevents resource-heavy long-range queries.                                                                                       |
| `store_original_data`     | Stores the full original log body if schema filtering is applied. Allows retrieval of dropped fields.                                                                             |
| `approx_partition`        | Uses evenly divided time ranges for query execution. Helps distribute query load in skewed data.                                                                                  |
| `extended_retention_days` | List of time ranges to retain data beyond `data_retention`. Must be applied before data expires.                                                                                  |
| `index_original_data`     | Enables full-text indexing on the raw log body. Allows search across fields not part of the schema.                                                                               |
| `index_all_values`        | Indexes all fields for exact-match lookups. Increases ingestion and index size. Best for fixed schemas.                                                                           |
