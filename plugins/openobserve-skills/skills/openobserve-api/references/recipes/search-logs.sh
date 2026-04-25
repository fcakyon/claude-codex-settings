#!/bin/bash
# Reference recipe: search logs with a SQL query over a relative time window.
set -euo pipefail
HOST="${OO_HOST:-https://eu1.openobserve.ai}"
ORG="${OO_ORG:-your-org-id}"
AUTH="-u ${OO_EMAIL:?set OO_EMAIL}:${OO_PASSWORD:?set OO_PASSWORD}"
STREAM="${OO_STREAM:-claude_code}"
HOURS="${HOURS:-24}"
BASE="$HOST/api/$ORG"

NOW_US=$(($(date +%s) * 1000000))
START_US=$((NOW_US - HOURS * 3600 * 1000000))

curl -s $AUTH -H 'Content-Type: application/json' \
  "$BASE/_search?type=logs" \
  -d "{\"query\":{\"sql\":\"SELECT host_name, COUNT(*) AS n FROM \\\"$STREAM\\\" GROUP BY host_name ORDER BY n DESC\",\"start_time\":$START_US,\"end_time\":$NOW_US,\"size\":50}}" \
  | jq .
