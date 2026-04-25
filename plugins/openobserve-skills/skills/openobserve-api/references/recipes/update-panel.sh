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
