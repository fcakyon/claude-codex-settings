# API Index

These APIs can be used to programmatically interact with OpenObserve.

All APIs must have an authorization header. Authorization header can be created using base64 encoded values of user id and password. For the sake of simplicity it is HTTP basic authentication mechanism.


Header creation mechanism:

> Authorization: Basic base64("username:password")

e.g. Header:

> Authorization: Basic YWRtaW46Q29tcGxleHBhc3MjMTIz

Make sure that you are sending the requests over HTTPS.

## API List

1. [Stream](stream/)
    1. [List](stream/list)
    1. [Schema](stream/schema)
    1. [Setting](stream/setting)
1. [Ingestion](ingestion/)
    1. [Bulk](ingestion/logs/bulk)
    1. [Json](ingestion/logs/json)
    1. [Multi](ingestion/logs/multi)
1. [Search](search/)
1. [Function](function/)
1. [User](user/)
    1. [Create](user/create)
    1. [Delete](user/delete)
    1. [List](user/list)
1. [Metrics](metrics)
