---
name: gcloud-usage
description: "Guide GCP observability tasks including Cloud Logging queries, structured log formatting, metric and trace analysis, alert policy design, and log cost reduction. Use when the user asks about GCloud logs, Cloud Logging queries, Google Cloud metrics, GCP observability, trace analysis, or debugging production issues on GCP."
---

# GCP Observability Best Practices

## 1. Structured Logging

### JSON Log Format

Use structured JSON logging for better queryability:

```json
{
  "severity": "ERROR",
  "message": "Payment failed",
  "httpRequest": { "requestMethod": "POST", "requestUrl": "/api/payment" },
  "labels": { "user_id": "123", "transaction_id": "abc" },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Severity Levels

- **DEBUG:** Detailed diagnostic info
- **INFO:** Normal operations, milestones
- **NOTICE:** Normal but significant events
- **WARNING:** Potential issues, degraded performance
- **ERROR:** Failures that don't stop the service
- **CRITICAL:** Failures requiring immediate action
- **ALERT:** Person must take action immediately
- **EMERGENCY:** System is unusable

## 2. Log Filtering Queries

### Common Filters

```
# By severity
severity >= WARNING

# By resource
resource.type="cloud_run_revision"
resource.labels.service_name="my-service"

# By time
timestamp >= "2025-01-15T00:00:00Z"

# By text content
textPayload =~ "error.*timeout"

# By JSON field
jsonPayload.user_id = "123"

# Combined
severity >= ERROR AND resource.labels.service_name="api"
```

### Advanced Queries

```
# Regex matching
textPayload =~ "status=[45][0-9]{2}"

# Substring search
textPayload : "connection refused"

# Multiple values
severity = (ERROR OR CRITICAL)
```

## 3. Choosing Between Metrics, Logs, and Traces

**Metrics** (aggregated numeric data over time): request counts, latency percentiles, resource utilization (CPU, memory), business KPIs (orders/minute).

**Logs** (detailed event records): error details and stack traces, audit trails, debugging specific requests.

**Traces** (request flow across services): latency breakdown by service, identifying bottlenecks, distributed system debugging.

## 4. Alert Policy Design

### Best Practices

- Only alert on actionable issues to avoid alert fatigue
- Use multi-condition alerts to reduce noise from transient spikes
- Set appropriate windows (5-15 min for most metrics)
- Include runbook links so responders can act quickly

### Common Alert Patterns

| Pattern | Condition | Use Case |
|---------|-----------|----------|
| Error rate | Error rate > 1% for 5 min | Service health monitoring |
| Latency | P99 > 2s for 10 min | Performance degradation detection |
| Resource exhaustion | Memory > 90% for 5 min | Capacity planning triggers |

## 5. Cost Reduction

- **Exclusion filters:** Drop verbose logs at ingestion
- **Sampling:** Log only a percentage of high-volume events
- **Shorter retention:** Reduce default 30-day retention
- **Downgrade logs:** Route to cheaper storage buckets

```
# Exclude health checks
resource.type="cloud_run_revision" AND httpRequest.requestUrl="/health"

# Exclude debug logs in production
severity = DEBUG
```

## 6. Debugging Workflow

1. **Start with metrics:** Identify when issues started
2. **Correlate with logs:** Filter logs around problem time
3. **Use traces:** Follow specific requests across services
4. **Check resource logs:** Look for infrastructure issues
5. **Compare baselines:** Check against known-good periods
