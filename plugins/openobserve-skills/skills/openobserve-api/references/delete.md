---
description: >-
  Delete OpenObserve streams via API. Deletion is async and handled by the
  compactor. Configure auto-deletion with data retention environment settings.
---
## Delete stream
OpenObserve provides multiple deletion strategies to manage your data lifecycle: immediate complete stream deletion, targeted time-range deletion with job tracking, and automatic retention-based cleanup.

## Overview
The Delete Stream API allows you to:

- Delete an entire stream and all its data
- Delete data within a specific time period with job tracking
- Monitor deletion job progress across clusters
- Manage cached query results
All deletion operations are asynchronous and processed by the Compactor service.

## Base URL
`https://example.remote.dev/`
Replace `example.remote.dev` with your actual OpenObserve instance URL.

## Content type
All requests and responses use JSON format.
```
Content-Type: application/json
```
## Endpoints

### Delete entire stream
Delete a complete stream and all associated data.

#### Request
**Method**: `DELETE` <br>
**Path**: `/api/{org_id}/streams/{stream_name}?type=logs&delete_all=true` <br>
**Parameters**:
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| org_id | string | path | Yes | Organization identifier |
| stream_name | string | path | Yes | Name of the stream to delete |
| type | string | query | Yes | Stream type: `logs`, `metrics`, or `traces` |
| delete_all | boolean | path | Yes | Delete all related resources like alerts and dashboards |

#### Request example
```bash
curl -X 'DELETE' \
  'https://example.remote.dev/api/default/streams/pii_test?type=logs&delete_all=true' \
  -H 'accept: application/json'
```

#### Response
**Status Code:** `200 OK`
```json
{
  "code": 200,
  "message": "stream deleted"
}
```

#### Response fields
| Field | Type | Description |
|-------|------|-------------|
| code | integer | HTTP status code |
| message | string | Confirmation message |

#### Status codes
| Code | Meaning |
|------|---------|
| 200 | Stream deleted successfully |
| 400 | Invalid parameters |
| 404 | Stream not found |
| 500 | Internal server error |

#### Behavior
Deletion is asynchronous and does not happen immediately:

1. When you call this API, the deletion request is marked in the system.
2. The API responds immediately, you do not wait for actual deletion.
3. A background service called Compactor checks for pending deletions every 10 minutes.
4. When Compactor runs, it starts deleting your stream. This can take anywhere from seconds to several minutes depending on how much data the stream contains.
5. In the worst-case scenario (if you request deletion just before Compactor runs), the entire process could take up to 30 minutes total.
6. You do not need to wait. The deletion happens in the background. You can check the stream status later to confirm it has been deleted.

!!! note "Notes"

	- This operation cannot be undone.
	- Data is deleted from both the `file_list` table and object store.
	- No job tracking is available for this endpoint

!!! note "Environment variables"
	- You can change the `compactor` run interval: `ZO_COMPACT_INTERVAL=600`. Unit is second. default is `10 minutes`.
	- You can configure data life cycle to auto delete old data: `ZO_COMPACT_DATA_RETENTION_DAYS=30`. The system will auto delete the data after `30` days. Note that the value must be greater than `0`.

### Delete stream data by time range
Delete stream data within a specific time period with job tracking.

#### Request
**Method:** `DELETE`
<br>
**Path:** `/api/{org_id}/streams/{stream_name}/data_by_time_range?start=<start_ts>&end=<end_ts>`

#### Parameters
| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `org_id` | string | Path | Organization identifier |
| `stream_name` | string | Path | Name of the stream |
| `start` | long | path | Start timestamp in microseconds (UTC). Inclusive. |
| `end` | long | path | End timestamp in microseconds (UTC). Inclusive. |
#### Request example
```bash
curl -X DELETE \
  'https://example.remote.dev/api/default/streams/test_stream/data_by_time_range?start=1748736000000000&end=1751241600000000'
```
#### Response
**Status Code:** `200 OK`
```json
{
  "id": "30ernyKEEMznL8KIXEaZhmDYRR9"
}
```
#### Response fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique job ID for tracking deletion progress |
#### Status codes
| Code | Meaning |
|------|---------|
| 200 | Deletion job created successfully |
| 400 | Invalid parameters (For example, invalid timestamp format) |
| 404 | Stream not found |
#### Behavior
- Initiates a compaction delete job.
- Returns a job ID that can be used to track progress.
- Deletes data from:

    - `file_list` table
    - Object store (for example, S3)
- Granularity:

    - **Logs:** Data is deleted every hour.
    - **Traces:** Data is deleted daily.
---

### Get delete job status
Check the status of a time-range deletion job.

#### Request
**Method:** `GET`
<br>
**Path:** `/api/{org_id}/streams/{stream_name}/data_by_time_range/status/{id}`

#### Parameters
| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `org_id` | string | Path | Organization identifier |
| `stream_name` | string | Path | Name of the stream |
| `id` | string | Path | Job ID returned from deletion request |

#### Request example
```bash
curl -X GET \
  'https://example.remote.dev/api/default/streams/test_stream/data_by_time_range/status/30ernyKEEMznL8KIXEaZhmDYRR9'
```

#### Response: Completed
**Status Code:** `200 OK`
```json
{
    "id": "30f080gLbU4i21VpY2O3YzwrKDH",
    "status": "Completed",
    "metadata": [
        {
            "cluster": "dev3",
            "region": "us-test-3",
            "id": "30f080gLbU4i21VpY2O3YzwrKDH",
            "key": "default/logs/delete_d3/2025-07-27T04:00:00Z,2025-07-28T04:00:00Z",
            "created_at": 1754003156467113,
            "ended_at": 1754003356516415,
            "status": "Completed"
        },
        {
            "cluster": "dev4",
            "region": "us-test-4",
            "id": "30f080gLbU4i21VpY2O3YzwrKDH",
            "key": "default/logs/delete_d3/2025-07-27T04:00:00Z,2025-07-28T04:00:00Z",
            "created_at": 1754003156467113,
            "ended_at": 1754003326523177,
            "status": "Completed"
        }
    ]
}
```
#### Response: Pending
**Status Code:** `200 OK`
```json
{
    "id": "30f080gLbU4i21VpY2O3YzwrKDH",
    "status": "Pending",
    "metadata": [
        {
            "cluster": "dev3",
            "region": "us-test-3",
            "id": "30f080gLbU4i21VpY2O3YzwrKDH",
            "key": "default/logs/delete_d3/2025-07-27T04:00:00Z,2025-07-28T04:00:00Z",
            "created_at": 1754003156467113,
            "ended_at": 0,
            "status": "Pending"
        },
        {
            "cluster": "dev4",
            "region": "us-test-4",
            "id": "30f080gLbU4i21VpY2O3YzwrKDH",
            "key": "default/logs/delete_d3/2025-07-27T04:00:00Z,2025-07-28T04:00:00Z",
            "created_at": 1754003156467113,
            "ended_at": 0,
            "status": "Pending"
        }
    ]
}
```
#### Response: With Errors
**Status Code:** `200 OK`
```json
{
    "id": "30fCWBSNWwTWnRJE0weFfDIc3zz",
    "status": "Pending",
    "metadata": [
        {
            "cluster": "dev4",
            "region": "us-test-4",
            "id": "30fCWBSNWwTWnRJE0weFfDIc3zz",
            "key": "default/logs/delete_d4/2025-07-21T14:00:00Z,2025-07-22T00:00:00Z",
            "created_at": 1754009269552227,
            "ended_at": 1754009558553845,
            "status": "Completed"
        }
    ],
    "errors": [
        {
            "cluster": "dev3",
            "error": "Error getting delete job status from cluster node: Status { code: Internal, message: \"Database error: DbError# SeaORMError# job not found\", metadata: MetadataMap { headers: {\"content-type\": \"application/grpc\", \"date\": \"Fri, 01 Aug 2025 00:58:01 GMT\", \"content-length\": \"0\"} }, source: None }",
            "region": "us-test-3"
        }
    ]
}
```
#### Response fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Job identifier |
| `status` | string | Overall job status: `Completed` or `Pending` |
| `metadata` | array | Array of per-cluster deletion details |
| `metadata[].cluster` | string | Cluster identifier |
| `metadata[].region` | string | Region/zone identifier |
| `metadata[].id` | string | Job ID |
| `metadata[].key` | string | Database key for the deletion operation |
| `metadata[].created_at` | long | Job creation timestamp in microseconds |
| `metadata[].ended_at` | long | Job completion timestamp in microseconds (0 if still pending) |
| `metadata[].status` | string | Individual cluster deletion status |
| `errors` | array | Array of errors from specific clusters (if any) |
| `errors[].cluster` | string | Cluster where error occurred |
| `errors[].region` | string | Region identifier |
| `errors[].error` | string | Error message |

#### Status Codes
| Code | Meaning |
|------|---------|
| 200 | Status retrieved successfully |
| 404 | Job ID not found |

#### Behavior
- Returns current status of deletion job
- Shows progress across all clusters in distributed setup
- Shows error details if any cluster encountered failures
- Status of `Pending` means deletion is still in progress
- Status of `Completed` means all clusters finished deletion
---

### Delete cache results
Delete cached query results for a stream.
#### Request
**Method:** `DELETE`
<br>
**Path:** `/api/{org_id}/streams/{stream_name}/cache/results?type=<stream_type>&ts=<timestamp>`

### Parameters
| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `org_id` | string | path | Organization identifier |
| `stream_name` | string | Path | Stream name (use `_all` to delete cache for all streams) |
| `type` | string | Query | Stream type: `logs`, `metrics`, or `traces` |
| `ts` | long | Query | Timestamp threshold in microseconds. Deletes cache from start up to this timestamp. Retains cache from timestamp onwards. |

#### Request example
```bash
curl -X DELETE \
  'https://example.remote.dev/api/default/streams/test_stream/_all/cache/results?type=logs&ts=1753849800000'
```

### Response
**Status Code:** `200 OK`
```json
{
  "code": 200,
  "message": "cache deleted"
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `code` | integer | HTTP status code |
| `message` | string | Confirmation message |

### Status Codes
| Code | Meaning |
|------|---------|
| 200 | Cache deleted successfully |
| 400 | Invalid parameters |
| 404 | Stream not found |

### Behavior
- Accepts `ts` (timestamp) query parameter in microseconds
- Deletes cache from `cache_start` up to the given `ts`
- Retains cache from `ts` onwards