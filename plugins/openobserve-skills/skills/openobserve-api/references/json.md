---
description: >-
  Ingest logs in batch via POST /api/{org}/{stream}/_json using standard JSON.
  Supports flattening, timestamps, and up to 200 fields per record.
---
# Logs Ingestion - JSON

Endpoint: `POST /api/{organization}/{stream}/_json`



This will upload multiple records in batch with standard json format.

## Request 

e.g. `POST /api/myorg/stream1/_json`

```json
[
    {
        "kubernetes.annotations.kubectl.kubernetes.io/default-container": "prometheus",
        "kubernetes.annotations.kubernetes.io/psp": "eks.privileged",
        "kubernetes.container_hash": "quay.io/prometheus/prometheus@sha256:4748e26f9369ee7270a7cd3fb9385c1adb441c05792ce2bce2f6dd622fd91d38",
        "kubernetes.container_image": "quay.io/prometheus/prometheus:v2.39.1",
        "kubernetes.container_name": "prometheus",
        "kubernetes.docker_id": "563f8f40062cd0188c11f39e89d47e6eacddb5624a8a93b39f77ec53b5c38bf5",
        "kubernetes.host": "ip-10-2-50-35.us-east-2.compute.internal",
        "kubernetes.labels.app.kubernetes.io/component": "prometheus",
        "kubernetes.labels.app.kubernetes.io/instance": "k8s",
        "kubernetes.labels.app.kubernetes.io/managed-by": "prometheus-operator",
        "kubernetes.labels.app.kubernetes.io/name": "prometheus",
        "kubernetes.labels.app.kubernetes.io/part-of": "kube-prometheus",
        "kubernetes.labels.app.kubernetes.io/version": "2.39.1",
        "kubernetes.labels.controller-revision-hash": "prometheus-k8s-5857d9766c",
        "kubernetes.labels.operator.prometheus.io/name": "k8s",
        "kubernetes.labels.operator.prometheus.io/shard": "0",
        "kubernetes.labels.prometheus": "k8s",
        "kubernetes.labels.statefulset.kubernetes.io/pod-name": "prometheus-k8s-1",
        "kubernetes.namespace_name": "monitoring",
        "kubernetes.pod_id": "ebdc171d-c891-495f-b4d6-e24711b70e64",
        "kubernetes.pod_name": "prometheus-k8s-1",
        "log": "ts=2022-12-27T14:09:59.212Z caller=klog.go:108 level=warn component=k8s_client_runtime func=Warningf msg=\"pkg/mod/k8s.io/client-go@v0.25.1/tools/cache/reflector.go:169: failed to list *v1.Pod: pods is forbidden: User \\\"system:serviceaccount:monitoring:prometheus-k8s\\\" cannot list resource \\\"pods\\\" in API group \\\"\\\" at the cluster scope\"",
        "stream": "stderr"
    },
		{
        "kubernetes.annotations.kubectl.kubernetes.io/default-container": "prometheus",
        "kubernetes.annotations.kubernetes.io/psp": "eks.privileged",
        "kubernetes.container_hash": "quay.io/prometheus/prometheus@sha256:4748e26f9369ee7270a7cd3fb9385c1adb441c05792ce2bce2f6dd622fd91d38",
        "kubernetes.container_image": "quay.io/prometheus/prometheus:v2.39.1",
        "kubernetes.container_name": "prometheus",
        "kubernetes.docker_id": "563f8f40062cd0188c11f39e89d47e6eacddb5624a8a93b39f77ec53b5c38bf5",
        "kubernetes.host": "ip-10-2-50-35.us-east-2.compute.internal",
        "kubernetes.labels.app.kubernetes.io/component": "prometheus",
        "kubernetes.labels.app.kubernetes.io/instance": "k8s",
        "kubernetes.labels.app.kubernetes.io/managed-by": "prometheus-operator",
        "kubernetes.labels.app.kubernetes.io/name": "prometheus",
        "kubernetes.labels.app.kubernetes.io/part-of": "kube-prometheus",
        "kubernetes.labels.app.kubernetes.io/version": "2.39.1",
        "kubernetes.labels.controller-revision-hash": "prometheus-k8s-5857d9766c",
        "kubernetes.labels.operator.prometheus.io/name": "k8s",
        "kubernetes.labels.operator.prometheus.io/shard": "0",
        "kubernetes.labels.prometheus": "k8s",
        "kubernetes.labels.statefulset.kubernetes.io/pod-name": "prometheus-k8s-1",
        "kubernetes.namespace_name": "monitoring",
        "kubernetes.pod_id": "ebdc171d-c891-495f-b4d6-e24711b70e64",
        "kubernetes.pod_name": "prometheus-k8s-1",
        "log": "ts=2022-12-27T14:09:59.212Z caller=klog.go:116 level=error component=k8s_client_runtime func=ErrorDepth msg=\"pkg/mod/k8s.io/client-go@v0.25.1/tools/cache/reflector.go:169: Failed to watch *v1.Pod: failed to list *v1.Pod: pods is forbidden: User \\\"system:serviceaccount:monitoring:prometheus-k8s\\\" cannot list resource \\\"pods\\\" in API group \\\"\\\" at the cluster scope\"",
        "stream": "stderr"
    }
]
```

Each line is one record.

## Response

```json
{
	"code": 200,
	"status": [
		{
			"name": "stream1",
			"successful": 2,
			"failed": 0
		}
	]
}
```

Returns successful and failed count for each stream.

## Restriction on number of fields/columns per record
> Applicable to cloud version

Please note only records having 200 or less fields/columns will be considered for ingestion , records having more than 200 fields/columns will be discarded with failed status.

> Applicable to open source version

One can configure ZO_COLS_PER_RECORD_LIMIT to set desired value for allowed number of fields/columns per record.

## Flattening of the JSON structure

OpenObserve flattens deep JSON logs. Below is an example log before and after being flattened.

#### Before

```json
{
	"actor": {
		"ip": "[redacted]",
		"id": 558875,
		"parent" : {
			"id": 45516,
			"active": true
		}
	}
	"response": {
		"error_occured": false,
		"status_code": 200
	}
	
}
```

#### After

```json
{
	"actor_ip": "[redacted]",
	"actor_id": 558875,
	"actor_parent_id": 45516,
	"actor_parent_active": true,
	"response_error_occured": false,
	"response_status_code": 200
}
```

### Restriction on flattening depth

⚠️ For performance reasons, OpenObserve limits the depth at which the JSON structure gets flattened. Past that limit, the generated field will contain unparsed JSON as a string.
The default depth is `3`, but this limit can be configured via the `ZO_INGEST_FLATTEN_LEVEL` environment variable. `ZO_INGEST_FLATTEN_LEVEL` can either be `0`, which disables the flattening limit, or any positive number, to change the depth at which the flattening stops.

## Timestamp

By default we add a field `_timestamp` for each record with the value of `NOW` in microseconds (unix epoch value). 

we support use of two fields to override the default value.

- _timestamp
- @timestamp

2 data formats are supported for timestamp fields
the value support two data type format:

- microseconds (unix epoch value)
- string value
    - RFC 3339 and ISO 8601 date and time string such as `1996-12-19T16:39:57-08:00`
    - RFC 2822 date and time string such as `Tue, 1 Jul 2003 10:52:37 +0200`

eg:

use microseconds

```json
[{
	"kubernetes.container_image": "quay.io/prometheus/prometheus:v2.39.1",
	"kubernetes.container_name": "prometheus", 
	"_timestamp": "1674789786006000"
}]
```

use string datetime

```json
[{
	"kubernetes.container_image": "quay.io/prometheus/prometheus:v2.39.1",
	"kubernetes.container_name": "prometheus", 
	"_timestamp": "2023-01-02T10:01:01Z"
}]
```
```

