#!/bin/bash
# Combined statusline: Session stats + Account usage

# === COLORS ===
RST='\033[0m'
WHITE='\033[97m'
DIM='\033[2m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'

color_for_pct() {
  if [ "$1" -lt 50 ]; then
    echo "$GREEN"
  elif [ "$1" -lt 70 ]; then
    echo "$YELLOW"
  else echo "$RED"; fi
}

color_for_time() {
  if [ "$1" -lt 3600 ]; then
    echo "$GREEN" # <1h (resets soon!)
  elif [ "$1" -lt 12600 ]; then
    echo "$YELLOW"     # 1-3.5h
  else echo "$RED"; fi # >3.5h (long wait)
}

# === SESSION STATS (from stdin JSON) ===
input=$(cat)
CONTEXT_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
USAGE=$(echo "$input" | jq '.context_window.current_usage // null')
COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')

if [ "$USAGE" != "null" ] && [ "$CONTEXT_SIZE" != "null" ]; then
  INPUT_TOKENS=$(echo "$USAGE" | jq '.input_tokens // 0')
  CACHE_CREATE=$(echo "$USAGE" | jq '.cache_creation_input_tokens // 0')
  CACHE_READ=$(echo "$USAGE" | jq '.cache_read_input_tokens // 0')
  CURRENT=$((INPUT_TOKENS + CACHE_CREATE + CACHE_READ))
  CTX_PCT=$((CURRENT * 100 / CONTEXT_SIZE))
else
  CTX_PCT=0
fi
COST_INT=$(printf "%.0f" "$COST")
CTX_CLR=$(color_for_pct $CTX_PCT)

# === ACCOUNT USAGE (from API with cache) ===
CACHE_FILE="/tmp/claude-usage-cache.json"
CACHE_AGE=30

get_file_age() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo $(($(date +%s) - $(stat -f %m "$1" 2> /dev/null || echo 0)))
  else
    echo $(($(date +%s) - $(stat -c %Y "$1" 2> /dev/null || echo 0)))
  fi
}

get_token() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    security find-generic-password -s "Claude Code-credentials" -w 2> /dev/null | jq -r '.claudeAiOauth.accessToken // empty'
  else
    # Try secret-tool first, fall back to credentials file
    local token
    token=$(secret-tool lookup service "Claude Code-credentials" 2> /dev/null | jq -r '.claudeAiOauth.accessToken // empty')
    if [ -z "$token" ] && [ -f "$HOME/.claude/.credentials.json" ]; then
      token=$(jq -r '.claudeAiOauth.accessToken // empty' "$HOME/.claude/.credentials.json" 2> /dev/null)
    fi
    echo "$token"
  fi
}

API_USAGE=""
if [ -f "$CACHE_FILE" ]; then
  AGE=$(get_file_age "$CACHE_FILE")
  if [ "$AGE" -lt "$CACHE_AGE" ]; then
    API_USAGE=$(cat "$CACHE_FILE")
  fi
fi

if [ -z "$API_USAGE" ]; then
  TOKEN=$(get_token)
  if [ -n "$TOKEN" ]; then
    API_USAGE=$(curl -s "https://api.anthropic.com/api/oauth/usage" \
      -H "Authorization: Bearer $TOKEN" \
      -H "anthropic-beta: oauth-2025-04-20" \
      -H "User-Agent: claude-code/2.0.76")
    echo "$API_USAGE" > "$CACHE_FILE" 2> /dev/null
  fi
fi

ACCT_PCT=$(echo "$API_USAGE" | jq -r '.five_hour.utilization // 0' | cut -d. -f1)
RESET_AT=$(echo "$API_USAGE" | jq -r '.five_hour.resets_at // empty')

if [ -n "$RESET_AT" ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    RESET_EPOCH=$(TZ=UTC date -j -f "%Y-%m-%dT%H:%M:%S" "${RESET_AT:0:19}" +%s 2> /dev/null || echo 0)
  else
    RESET_EPOCH=$(date -u -d "${RESET_AT:0:19}" +%s 2> /dev/null || echo 0)
  fi
  NOW=$(date +%s)
  SECS_LEFT=$((RESET_EPOCH - NOW))
  [ "$SECS_LEFT" -lt 0 ] && SECS_LEFT=0
  HOURS=$((SECS_LEFT / 3600))
  MINS=$(((SECS_LEFT % 3600) / 60))
  TIME_STR="${HOURS}h${MINS}m"
else
  TIME_STR="?"
  SECS_LEFT=0
fi

ACCT_CLR=$(color_for_pct $ACCT_PCT)
TIME_CLR=$(color_for_time $SECS_LEFT)

# === OUTPUT ===
printf "${DIM}[Session]${RST} ${CTX_CLR}%d%%${RST} ${WHITE}\$%d${RST} ${DIM}|${RST} ${DIM}[5H]${RST} ${ACCT_CLR}%d%%${RST} ${TIME_CLR}%s${RST}" "$CTX_PCT" "$COST_INT" "$ACCT_PCT" "$TIME_STR"
