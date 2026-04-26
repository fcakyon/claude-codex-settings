---
description: >-
  Ingest logs via Grafana Loki-compatible push API at POST /api/{organization}/loki/api/v1/push.
  Supports Loki stream labels, nanosecond timestamps, and structured metadata.
---
# Logs Ingestion - Loki

Endpoint: `POST /api/{organization}/loki/api/v1/push`

OpenObserve is compatible with the Grafana Loki push API. You can send logs using any Loki-compatible client (e.g. Promtail, Grafana Agent, Alloy) by pointing it at OpenObserve.

> we use `o2_stream_name` label for custom stream name, default will push into `default` stream.

## Request

e.g. `POST /api/myorg/loki/api/v1/push`

Content-Type: `application/json`

```json
{
  "streams": [
    {
      "stream": {
        "o2_stream_name": "custom_stream",
        "kubernetes_namespace": "monitoring",
        "kubernetes_pod_name": "prometheus-k8s-1",
        "kubernetes_container_name": "prometheus"
      },
      "values": [
        [
          "1672149599212000000",
          "ts=2022-12-27T14:09:59.212Z caller=klog.go:108 level=warn component=k8s_client_runtime msg=\"failed to list *v1.Pod\""
        ],
        [
          "1672149600000000000",
          "ts=2022-12-27T14:10:00.000Z caller=klog.go:116 level=error component=k8s_client_runtime msg=\"Failed to watch *v1.Pod\""
        ]
      ]
    }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `streams` | array | List of log streams to push. |
| `streams[].stream` | object | Key-value label pairs that identify the stream. Labels are indexed and can be used for filtering. |
| `streams[].values` | array | List of log entries. Each entry is a two-element array: `[timestamp, line]`. |
| `streams[].values[][0]` | string | Unix timestamp in **nanoseconds** as a string. |
| `streams[].values[][1]` | string | Log line content. |

## Response

```json
{}
```

An empty JSON object `{}` with HTTP status `204 No Content` indicates success, matching the standard Loki push API behavior.

## Authentication

Pass your credentials using HTTP Basic Auth or via the `Authorization` header, the same as all other OpenObserve ingestion endpoints.

```
Authorization: Basic <base64(user:password)>
```

## Configuring Promtail

Point Promtail at OpenObserve by setting the Loki push URL in your `promtail.yaml`:

```yaml
clients:
  - url: https://<openobserve-host>/api/<organization>/loki/api/v1/push
    basic_auth:
      username: <user>
      password: <password>
```

## Configuring Grafana Alloy

```alloy
loki.write "openobserve" {
  endpoint {
    url = "https://<openobserve-host>/api/<organization>/loki/api/v1/push"
    basic_auth {
      username = "<user>"
      password = "<password>"
    }
  }
}
```
