---
description: >-
  Ingest logs via OpenTelemetry Protocol (OTLP) at POST /api/{org}/v1/logs.
  Supports OTLP JSON and Protobuf formats with resource attributes and log records.
---
# Logs Ingestion - OTLP

Endpoint: `POST /api/{organization}/v1/logs`

OpenObserve supports the OpenTelemetry Protocol (OTLP) for log ingestion. You can send logs from any OpenTelemetry-compatible collector or SDK by pointing it at OpenObserve.

> we use custom http header `stream-name` for speciafic stream name, default will push into `default` stream.

## Request

e.g. `POST /api/myorg/v1/logs`

Content-Type: `application/json` (JSON) or `application/x-protobuf` (Protobuf)

```json
{
  "resourceLogs": [
    {
      "resource": {
        "attributes": [
          {
            "key": "service.name",
            "value": { "stringValue": "my-service" }
          },
          {
            "key": "service.version",
            "value": { "stringValue": "1.2.3" }
          },
          {
            "key": "host.name",
            "value": { "stringValue": "ip-10-2-50-35.us-east-2.compute.internal" }
          }
        ]
      },
      "scopeLogs": [
        {
          "scope": {
            "name": "my-logger",
            "version": "1.0.0"
          },
          "logRecords": [
            {
              "timeUnixNano": "1672149599212000000",
              "observedTimeUnixNano": "1672149599212000000",
              "severityNumber": 9,
              "severityText": "INFO",
              "body": {
                "stringValue": "Request processed successfully"
              },
              "attributes": [
                {
                  "key": "http.method",
                  "value": { "stringValue": "GET" }
                },
                {
                  "key": "http.status_code",
                  "value": { "intValue": "200" }
                },
                {
                  "key": "trace_id",
                  "value": { "stringValue": "4bf92f3577b34da6a3ce929d0e0e4736" }
                }
              ],
              "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
              "spanId": "00f067aa0ba902b7"
            }
          ]
        }
      ]
    }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `resourceLogs` | array | List of resource log groups. |
| `resourceLogs[].resource` | object | Resource describing the entity producing the logs (e.g. service, host). |
| `resourceLogs[].resource.attributes` | array | Key-value pairs for resource-level metadata. |
| `resourceLogs[].scopeLogs` | array | List of instrumentation scope log groups. |
| `scopeLogs[].scope` | object | Instrumentation scope (library name and version). |
| `scopeLogs[].logRecords` | array | List of individual log records. |
| `logRecords[].timeUnixNano` | string | Log timestamp in **nanoseconds** since Unix epoch. |
| `logRecords[].observedTimeUnixNano` | string | Time the log was observed by the collector, in nanoseconds. |
| `logRecords[].severityNumber` | integer | Numeric severity level (1–24). See [OTLP severity levels](https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber). |
| `logRecords[].severityText` | string | Human-readable severity string (e.g. `INFO`, `WARN`, `ERROR`). |
| `logRecords[].body` | object | Log message body. Typically a `stringValue`. |
| `logRecords[].attributes` | array | Key-value pairs for log-level metadata. |
| `logRecords[].traceId` | string | Trace ID associated with this log record (hex string). |
| `logRecords[].spanId` | string | Span ID associated with this log record (hex string). |

## Response

```json
{
  "partialSuccess": {}
}
```

HTTP status `200 OK` with an empty `partialSuccess` object indicates all records were accepted, matching the standard OTLP HTTP response format.

## Authentication

Pass your credentials using HTTP Basic Auth or via the `Authorization` header:

```
Authorization: Basic <base64(user:password)>
```

## Configuring OpenTelemetry Collector

Configure the OTLP exporter in your OpenTelemetry Collector `config.yaml` to forward logs to OpenObserve:

```yaml
exporters:
  otlphttp/openobserve:
    endpoint: https://<openobserve-host>/api/<organization>
    headers:
      Authorization: "Basic <base64(user:password)>"
      stream-name: "custom_stream"

service:
  pipelines:
    logs:
      receivers: [...]
      processors: [...]
      exporters: [otlphttp/openobserve]
```
