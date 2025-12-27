#!/bin/bash
# Cross-platform statusline (no jq)

RST='\033[0m' WHITE='\033[97m' DIM='\033[2m'
GREEN='\033[32m' YELLOW='\033[33m' RED='\033[31m'

json_num() { echo "$2" | sed -n 's/.*"'"$1"'"[[:space:]]*:[[:space:]]*\([0-9.]*\).*/\1/p' | head -1; }
color_pct() { [ "$1" -lt 50 ] && echo "$GREEN" || { [ "$1" -lt 70 ] && echo "$YELLOW" || echo "$RED"; }; }
color_time() { [ "$1" -lt 3600 ] && echo "$GREEN" || { [ "$1" -lt 12600 ] && echo "$YELLOW" || echo "$RED"; }; }

# Session stats from stdin
input=$(cat)
CTX_SIZE=$(json_num context_window_size "$input")
CTX_SIZE=${CTX_SIZE:-200000}
COST=$(json_num total_cost_usd "$input")
COST=${COST:-0}
INPUT_T=$(json_num input_tokens "$input")
INPUT_T=${INPUT_T:-0}
CACHE_C=$(json_num cache_creation_input_tokens "$input")
CACHE_C=${CACHE_C:-0}
CACHE_R=$(json_num cache_read_input_tokens "$input")
CACHE_R=${CACHE_R:-0}

CURRENT=$((INPUT_T + CACHE_C + CACHE_R))
CTX_PCT=$((CTX_SIZE > 0 ? CURRENT * 100 / CTX_SIZE : 0))
COST_INT=$(LC_NUMERIC=C printf "%.0f" "${COST:-0}" 2> /dev/null || echo 0)

# Account usage from API (cached 30s)
CACHE_FILE="/tmp/claude-usage-cache.json"
if [[ "$OSTYPE" == darwin* ]]; then
  AGE=$(($(date +%s) - $(stat -f %m "$CACHE_FILE" 2> /dev/null || echo 0)))
else
  AGE=$(($(date +%s) - $(stat -c %Y "$CACHE_FILE" 2> /dev/null || echo 0)))
fi

API=""
[ -f "$CACHE_FILE" ] && [ "$AGE" -lt 30 ] && API=$(cat "$CACHE_FILE")

if [ -z "$API" ]; then
  if [[ "$OSTYPE" == darwin* ]]; then
    CREDS=$(security find-generic-password -s "Claude Code-credentials" -w 2> /dev/null)
  elif [ -f "$HOME/.claude/.credentials.json" ]; then
    CREDS=$(cat "$HOME/.claude/.credentials.json")
  fi
  TOKEN=$(echo "$CREDS" | sed -n 's/.*"claudeAiOauth"[^}]*"accessToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  if [ -n "$TOKEN" ]; then
    API=$(curl -s "https://api.anthropic.com/api/oauth/usage" \
      -H "Authorization: Bearer $TOKEN" \
      -H "anthropic-beta: oauth-2025-04-20" \
      -H "User-Agent: claude-code/2.0.76")
    echo "$API" > "$CACHE_FILE" 2> /dev/null
  fi
fi

ACCT_PCT=$(echo "$API" | sed -n 's/.*"five_hour"[^}]*"utilization"[[:space:]]*:[[:space:]]*\([0-9.]*\).*/\1/p' | head -1)
ACCT_PCT=${ACCT_PCT%.*}
ACCT_PCT=${ACCT_PCT:-0}
RESET_AT=$(echo "$API" | sed -n 's/.*"five_hour"[^}]*"resets_at"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

TIME_STR="?" SECS=0
if [ -n "$RESET_AT" ]; then
  if [[ "$OSTYPE" == darwin* ]]; then
    RESET_EPOCH=$(TZ=UTC date -j -f "%Y-%m-%dT%H:%M:%S" "${RESET_AT:0:19}" +%s 2> /dev/null || echo 0)
  else
    RESET_EPOCH=$(date -u -d "${RESET_AT:0:19}" +%s 2> /dev/null || echo 0)
  fi
  SECS=$((RESET_EPOCH - $(date +%s)))
  [ "$SECS" -lt 0 ] && SECS=0
  TIME_STR="$((SECS / 3600))h$(((SECS % 3600) / 60))m"
fi

printf "${DIM}[Session]${RST} $(color_pct $CTX_PCT)%d%%${RST} ${WHITE}\$%d${RST} ${DIM}|${RST} ${DIM}[5H]${RST} $(color_pct $ACCT_PCT)%d%%${RST} $(color_time $SECS)%s${RST}" "$CTX_PCT" "$COST_INT" "$ACCT_PCT" "$TIME_STR"
