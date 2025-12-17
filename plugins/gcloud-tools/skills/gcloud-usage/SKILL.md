---
name: gcloud-usage
description: This skill should be used when user asks about "GCloud logs", "Cloud Logging queries", "Google Cloud metrics", "GCP observability", "trace analysis", or "debugging production issues on GCP".
---

# GCP Observability Best Practices

## Structured Logging

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

Use appropriate severity for filtering:

- **DEBUG:** Detailed diagnostic info
- **INFO:** Normal operations, milestones
- **NOTICE:** Normal but significant events
- **WARNING:** Potential issues, degraded performance
- **ERROR:** Failures that don't stop the service
- **CRITICAL:** Failures requiring immediate action
- **ALERT:** Person must take action immediately
- **EMERGENCY:** System is unusable

## Log Filtering Queries

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

## Metrics vs Logs vs Traces

### When to Use Each

**Metrics:** Aggregated numeric data over time

- Request counts, latency percentiles
- Resource utilization (CPU, memory)
- Business KPIs (orders/minute)

**Logs:** Detailed event records

- Error details and stack traces
- Audit trails
- Debugging specific requests

**Traces:** Request flow across services

- Latency breakdown by service
- Identifying bottlenecks
- Distributed system debugging

## Alert Policy Design

### Alert Best Practices

- **Avoid alert fatigue:** Only alert on actionable issues
- **Use multi-condition alerts:** Reduce noise from transient spikes
- **Set appropriate windows:** 5-15 min for most metrics
- **Include runbook links:** Help responders act quickly

### Common Alert Patterns

**Error rate:**

- Condition: Error rate > 1% for 5 minutes
- Good for: Service health monitoring

**Latency:**

- Condition: P99 latency > 2s for 10 minutes
- Good for: Performance degradation detection

**Resource exhaustion:**

- Condition: Memory > 90% for 5 minutes
- Good for: Capacity planning triggers

## Cost Optimization

### Reducing Log Costs

- **Exclusion filters:** Drop verbose logs at ingestion
- **Sampling:** Log only percentage of high-volume events
- **Shorter retention:** Reduce default 30-day retention
- **Downgrade logs:** Route to cheaper storage buckets

### Exclusion Filter Examples

```
# Exclude health checks
resource.type="cloud_run_revision" AND httpRequest.requestUrl="/health"

# Exclude debug logs in production
severity = DEBUG
```

## Debugging Workflow

1. **Start with metrics:** Identify when issues started
2. **Correlate with logs:** Filter logs around problem time
3. **Use traces:** Follow specific requests across services
4. **Check resource logs:** Look for infrastructure issues
5. **Compare baselines:** Check against known-good periods
