---
title: API Reference | OpenObserve
description: Programmatic access to OpenObserve. HTTP basic-auth endpoints for streams, ingestion, search, functions, users, and metrics.
---
# API Index

These APIs can be used to programmatically interact with OpenObserve.

All APIs must have an authorization header. Authorization header can be created using base64 encoded values of user id and password. For the sake of simplicity it is HTTP basic authentication mechanism.

Header creation mechanism:

```
Authorization: Basic base64("username:password")
```

For example:

```
Authorization: Basic YWRtaW46Q29tcGxleHBhc3MjMTIz
```

Make sure that you are sending the requests over HTTPS.

## API List

1. [Stream](stream/index.md)
    1. [List](stream/list.md)
    1. [Schema](stream/schema.md)
    1. [Setting](stream/setting.md)
1. [Ingestion](ingestion/index.md)
    1. [Bulk](ingestion/logs/bulk.md)
    1. [Json](ingestion/logs/json.md)
    1. [Multi](ingestion/logs/multi.md)
1. [Search](search/index.md)
1. [Function](function/index.md)
1. [User](user/index.md)
    1. [Create](user/create.md)
    1. [Delete](user/delete.md)
    1. [List](user/list.md)
1. [Metrics](metrics.md)

## Next steps

- [Quickstart](../../getting-started.md): get OpenObserve running and grab your credentials.
- [Ingestion](../../ingestion/index.md): start sending logs, metrics, and traces.
- [OpenTelemetry / OTLP](../../ingestion/logs/otlp.md): the recommended modern ingestion path.

**Need some help?**

- Join our [Community Slack](https://short.openobserve.ai/community) 
- Or [Contact support](https://openobserve.ai/contactus/)
