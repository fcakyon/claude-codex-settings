#!/bin/bash
# Reference recipe: create a small dashboard from scratch via the OpenObserve
# REST API. Replace the AUTH, HOST, ORG, and STREAM values for your env.
set -euo pipefail
HOST="${OO_HOST:-https://eu1.openobserve.ai}"
ORG="${OO_ORG:-your-org-id}"
AUTH="-u ${OO_EMAIL:?set OO_EMAIL}:${OO_PASSWORD:?set OO_PASSWORD}"
STREAM="${OO_STREAM:-claude_code}"
BASE="$HOST/api/$ORG"

PAYLOAD=$(cat <<JSON
{
  "title": "API Generated Dashboard",
  "description": "Created via REST API",
  "version": 8,
  "tabs": [{
    "tabId": "default", "name": "Default",
    "panels": [{
      "id": "p1", "type": "metric", "title": "Total events",
      "queryType": "sql",
      "queries": [{
        "query": "SELECT COUNT(*) AS value FROM \"$STREAM\"",
        "customQuery": true,
        "fields": {
          "stream":"$STREAM","stream_type":"logs",
          "x":[],"z":[],"breakdown":[],
          "y":[{"label":"Value","alias":"value","column":"value","aggregationFunction":"sum","treatAsNonTimeseries":false}],
          "filter":{"filterType":"group","logicalOperator":"AND","conditions":[]}
        },
        "config":{}
      }],
      "config": {"unit":"numbers","decimals":0},
      "layout": {"x":0,"y":0,"w":96,"h":7,"i":1}
    }]
  }],
  "variables": {"list": [], "showDynamicFilters": true},
  "defaultDatetimeDuration": {"type":"relative","relativeTimePeriod":"30d"}
}
JSON
)

curl $AUTH -X POST -H 'Content-Type: application/json' \
  "$BASE/dashboards?folder=default" -d "$PAYLOAD" | jq .
