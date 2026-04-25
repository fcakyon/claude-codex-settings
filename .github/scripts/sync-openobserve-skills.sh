#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

# OpenObserve does not publish official agent-skill content, so this script
# clones the public docs repo and copies the API reference markdown into
# the skill as offline references. The hand-written SKILL.md (already in
# the repo) is the source of truth for triggers, recipes, and pitfalls.

clone_or_update https://github.com/openobserve/openobserve-docs openobserve-docs
SRC="$HOME/dev/openobserve-docs"

TARGET="plugins/openobserve-skills/skills/openobserve-api/references"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ABS_TARGET="$REPO_ROOT/$TARGET"

mkdir -p "$ABS_TARGET"

# Copy the relevant API reference pages — these are the ones an AI agent
# is most likely to need to consult mid-task.
copy_doc() {
  local rel="$1"
  local src_path="$SRC/$rel"
  if [ -f "$src_path" ]; then
    local dst="$ABS_TARGET/$(basename "$rel")"
    cp "$src_path" "$dst"
    echo "  copied $rel"
  else
    echo "  WARNING: doc not found in upstream: $rel" >&2
  fi
}

# Search / SQL
copy_doc "docs/reference/api/search/search.md"
copy_doc "docs/reference/api/search/around.md"
copy_doc "docs/reference/api/search/value.md"
# Streams
copy_doc "docs/reference/api/stream/list.md"
copy_doc "docs/reference/api/stream/schema.md"
copy_doc "docs/reference/api/stream/setting.md"
copy_doc "docs/reference/api/stream/delete.md"
# Ingestion (most-used paths)
copy_doc "docs/reference/api/ingestion/logs/json.md"
copy_doc "docs/reference/api/ingestion/logs/multi.md"
copy_doc "docs/reference/api/ingestion/logs/bulk.md"
copy_doc "docs/reference/api/ingestion/logs/otlp.md"
copy_doc "docs/reference/api/ingestion/logs/loki.md"
# Auth + general
copy_doc "docs/reference/api/index.md"

# Recipes directory — small reference scripts an agent can read for
# concrete request/response examples
mkdir -p "$ABS_TARGET/recipes"

cat > "$ABS_TARGET/recipes/build-dashboard.sh" << 'EOF'
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
EOF
chmod +x "$ABS_TARGET/recipes/build-dashboard.sh"

cat > "$ABS_TARGET/recipes/search-logs.sh" << 'EOF'
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
EOF
chmod +x "$ABS_TARGET/recipes/search-logs.sh"

cat > "$ABS_TARGET/recipes/update-panel.sh" << 'EOF'
#!/bin/bash
# Reference recipe: hash-aware mutation of a single dashboard panel.
set -euo pipefail
HOST="${OO_HOST:-https://eu1.openobserve.ai}"
ORG="${OO_ORG:-your-org-id}"
AUTH="-u ${OO_EMAIL:?set OO_EMAIL}:${OO_PASSWORD:?set OO_PASSWORD}"
DASH_ID="${1:?usage: update-panel.sh <dashboard_id> <panel_id>}"
PANEL_ID="${2:?usage: update-panel.sh <dashboard_id> <panel_id>}"
BASE="$HOST/api/$ORG"

# Fetch current dashboard to obtain hash
RAW=$(curl -s $AUTH "$BASE/dashboards/$DASH_ID?folder=default")
HASH=$(echo "$RAW" | jq -r .hash)

# Pull the existing panel, change just the title, and PUT it back
NEW_PANEL=$(echo "$RAW" | jq --arg pid "$PANEL_ID" '.v8.tabs[0].panels[] | select(.id == $pid) | .title = "Updated by API"')

curl $AUTH -X PUT -H 'Content-Type: application/json' \
  "$BASE/dashboards/$DASH_ID/panels/$PANEL_ID?folder=default&hash=$HASH" \
  -d "$NEW_PANEL" | jq .
EOF
chmod +x "$ABS_TARGET/recipes/update-panel.sh"

ensure_license "plugins/openobserve-skills/skills/openobserve-api" Apache-2.0
create_zip "plugins/openobserve-skills/skills/openobserve-api"

echo "Done syncing openobserve-skills."
