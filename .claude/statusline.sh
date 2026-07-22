#!/bin/bash
# Combined statusline: session stats + account usage

RST='\033[0m'
DIM='\033[2m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'

color_for_pct() {
  if [ "$1" -lt 50 ]; then
    COLOR=$GREEN
  elif [ "$1" -lt 70 ]; then
    COLOR=$YELLOW
  else
    COLOR=$RED
  fi
}

progress_bar() {
  local pct=$1 width=$2 clr=$3 filled bar=""
  filled=$((pct * width / 100))
  [ "$filled" -gt "$width" ] && filled=$width
  [ "$filled" -lt 0 ] && filled=0
  for ((i = 0; i < filled; i++)); do bar+="█"; done
  for ((i = filled; i < width; i++)); do bar+="░"; done
  printf -v BAR "${clr}%s${DIM}%s${RST}" "${bar:0:filled}" "${bar:filled}"
}

count_hooks() {
  [ "$#" -gt 0 ] || {
    printf '0\n'
    return
  }
  awk '
    function indentation(line) {
      match(line, /[^[:space:]]/)
      return RSTART - 1
    }
    FNR == 1 { found = 0 }
    !found && /^[[:space:]]*"hooks"[[:space:]]*:[[:space:]]*\{/ {
      found = 1
      base = indentation($0)
      next
    }
    found == 1 {
      level = indentation($0)
      if (level <= base && /^[[:space:]]*}/) {
        found = 2
        next
      }
      if (level == base + 2 && /^[[:space:]]*"[^"]+"[[:space:]]*:/) count++
    }
    END { print count + 0 }
  ' "$@"
}

# Claude supplies session and account data as JSON on stdin.
IFS=$'\t' read -r CONTEXT_SIZE CURRENT SESSION_ID CWD MODEL_FULL ACCT_PCT WEEK_PCT RESET_AT < <(
  awk '
    function value(source, key, fallback, tail, end) {
      tail = index(source, "\"" key "\"")
      if (!tail) return fallback
      tail = substr(source, tail + length(key) + 2)
      sub(/^[[:space:]]*:[[:space:]]*/, "", tail)
      if (substr(tail, 1, 1) == "\"") {
        tail = substr(tail, 2)
        end = index(tail, "\"")
        return end ? substr(tail, 1, end - 1) : fallback
      }
      return match(tail, /^-?[0-9]+([.][0-9]+)?/) ? substr(tail, RSTART, RLENGTH) : fallback
    }
    { payload = payload $0 }
    END {
      five_hour = substr(payload, index(payload, "\"five_hour\""))
      seven_day = substr(payload, index(payload, "\"seven_day\""))
      printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n",
        value(payload, "context_window_size", 0),
        value(payload, "total_input_tokens", 0),
        value(payload, "session_id", ""),
        value(payload, "current_dir", ""),
        value(payload, "display_name", "Claude"),
        value(five_hour, "used_percentage", 0),
        value(seven_day, "used_percentage", 0),
        value(five_hour, "resets_at", "")
    }
  '
)

SETTINGS_FILE="$HOME/.claude/settings.json"
COMPACT_SIZE=""
ENABLED_PLUGINS="|"
if [ -f "$SETTINGS_FILE" ]; then
  while IFS=$'\t' read -r kind value; do
    if [ "$kind" = "compact" ]; then
      COMPACT_SIZE=$value
    else
      ENABLED_PLUGINS="${ENABLED_PLUGINS}${value}|"
    fi
  done < <(
    awk '
    /"CLAUDE_CODE_AUTO_COMPACT_WINDOW"[[:space:]]*:/ {
      value = $0
      gsub(/[^0-9]/, "", value)
      print "compact\t" value
    }
    /^  "enabledPlugins"[[:space:]]*:[[:space:]]*\{/ { enabled = 1; next }
    enabled && /^  }/ { enabled = 0 }
    enabled && /:[[:space:]]*true[,]?[[:space:]]*$/ {
      name = $0
      sub(/^[[:space:]]*"/, "", name)
      sub(/".*/, "", name)
      print "plugin\t" name
    }
    ' "$SETTINGS_FILE"
  )
fi
[ -n "$COMPACT_SIZE" ] && [ "$COMPACT_SIZE" -lt "$CONTEXT_SIZE" ] && CONTEXT_SIZE=$COMPACT_SIZE
ACCT_PCT=${ACCT_PCT%%.*}
WEEK_PCT=${WEEK_PCT%%.*}
MODEL_NAME=${MODEL_FULL#Claude }
CTX_PCT=$((CURRENT * 100 / CONTEXT_SIZE))
color_for_pct "$CTX_PCT"
CTX_CLR=$COLOR

# Count loaded CLAUDE.md files.
CLAUDE_MD_COUNT=0
[ -f "$HOME/.claude/CLAUDE.md" ] && ((CLAUDE_MD_COUNT++))
[ -n "$CWD" ] && [ -f "$CWD/CLAUDE.md" ] && ((CLAUDE_MD_COUNT++))
[ -n "$CWD" ] && [ -f "$CWD/.claude/CLAUDE.md" ] && ((CLAUDE_MD_COUNT++))
[ -n "$CWD" ] && [ -f "$CWD/CLAUDE.local.md" ] && ((CLAUDE_MD_COUNT++))

# Count connected MCP servers once per name.
MCP_COUNT=0
DEBUG_LOG="$HOME/.claude/debug/${SESSION_ID}.txt"
if [ -n "$SESSION_ID" ] && [ -f "$DEBUG_LOG" ]; then
  MCP_COUNT=$(awk '
    /MCP server "[^"]*": Successfully connected/ {
      split($0, a, "MCP server \\\"")
      split(a[2], b, "\\\"")
      if (!(b[1] in seen)) {
        seen[b[1]] = 1
        count++
      }
    }
    END { print count + 0 }
  ' "$DEBUG_LOG")
fi

# Find user, project, and enabled plugin hook files.
HOOK_FILES=()
[ -f "$SETTINGS_FILE" ] && HOOK_FILES+=("$SETTINGS_FILE")
[ -n "$CWD" ] && [ -f "$CWD/.claude/settings.json" ] && HOOK_FILES+=("$CWD/.claude/settings.json")
[ -n "$CWD" ] && [ -f "$CWD/.claude/settings.local.json" ] && HOOK_FILES+=("$CWD/.claude/settings.local.json")
PLUGINS_FILE="$HOME/.claude/plugins/installed_plugins.json"
if [ -f "$PLUGINS_FILE" ]; then
  while IFS=$'\t' read -r plugin install_path; do
    case "$ENABLED_PLUGINS" in
      *"|$plugin|"*)
        [ -f "$install_path/hooks/hooks.json" ] && HOOK_FILES+=("$install_path/hooks/hooks.json")
        ;;
    esac
  done < <(
    awk '
      /^    "[^"]+"[[:space:]]*:[[:space:]]*\[/ {
        plugin = $0
        sub(/^[[:space:]]*"/, "", plugin)
        sub(/".*/, "", plugin)
      }
      plugin && /"installPath"[[:space:]]*:/ {
        path = $0
        sub(/.*"installPath"[[:space:]]*:[[:space:]]*"/, "", path)
        sub(/".*/, "", path)
        print plugin "\t" path
        plugin = ""
      }
    ' "$PLUGINS_FILE"
  )
fi
HOOKS_COUNT=$(count_hooks "${HOOK_FILES[@]}")

# Read the newest active TODO list for this session.
TODO_TEXT=""
TODO_COUNT=""
TODO_DIR="$HOME/.claude/todos"
if [ -n "$SESSION_ID" ] && [ -d "$TODO_DIR" ]; then
  while IFS= read -r TODO_FILE; do
    IFS=$'\t' read -r TOTAL COMPLETED ACTIVE_FORM < <(
      awk '
        /^[[:space:]]*\{/ { total++ }
        /"status"[[:space:]]*:[[:space:]]*"completed"/ { completed++ }
        /"status"[[:space:]]*:[[:space:]]*"in_progress"/ && active == "" { in_progress = 1 }
        in_progress && /"activeForm"[[:space:]]*:/ {
          active = $0
          sub(/.*"activeForm"[[:space:]]*:[[:space:]]*"/, "", active)
          sub(/"[,]?[[:space:]]*$/, "", active)
          in_progress = 0
        }
        END { printf "%d\t%d\t%s\n", total, completed, active }
      ' "$TODO_FILE"
    )
    if [ "$TOTAL" -gt 0 ]; then
      if [ -n "$ACTIVE_FORM" ]; then
        [ ${#ACTIVE_FORM} -gt 50 ] && ACTIVE_FORM="${ACTIVE_FORM:0:47}..."
        TODO_TEXT=$ACTIVE_FORM
        TODO_COUNT="(${COMPLETED}/${TOTAL})"
        break
      elif [ "$COMPLETED" -gt 0 ]; then
        TODO_COUNT="(${COMPLETED}/${TOTAL})"
        break
      fi
    fi
  done < <(ls -t "$TODO_DIR/${SESSION_ID}-agent-"*.json 2>/dev/null)
fi

# Calculate five-hour reset time and usage speed.
if [ -n "$RESET_AT" ]; then
  SECS_LEFT=$((RESET_AT - $(date +%s)))
  [ "$SECS_LEFT" -lt 0 ] && SECS_LEFT=0
  TIME_STR="$((SECS_LEFT / 3600))h$(((SECS_LEFT % 3600) / 60))m"
else
  TIME_STR="?"
  SECS_LEFT=0
fi

ELAPSED_SECS=$((18000 - SECS_LEFT))
if [ "$ELAPSED_SECS" -gt 0 ]; then
  SPEED_X10=$((ACCT_PCT * 36000 / ELAPSED_SECS))
else
  SPEED_X10=0
fi
SPEED_STR="$((SPEED_X10 / 10))%/hr"

if [ "$SPEED_X10" -lt 175 ]; then
  ACCT_CLR=$GREEN
elif [ "$SPEED_X10" -le 225 ]; then
  ACCT_CLR=$YELLOW
else
  ACCT_CLR=$RED
fi

progress_bar "$CTX_PCT" 10 "$CTX_CLR"
CTX_BAR=$BAR
progress_bar "$ACCT_PCT" 10 "$ACCT_CLR"
ACCT_BAR=$BAR
color_for_pct "$WEEK_PCT"
WEEK_CLR=$COLOR
progress_bar "$WEEK_PCT" 10 "$WEEK_CLR"
WEEK_BAR=$BAR

printf "${DIM}[%s]${RST} %s ${CTX_CLR}%d%%${RST} ${DIM}of %dk${RST}" "$MODEL_NAME" "$CTX_BAR" "$CTX_PCT" "$((CONTEXT_SIZE / 1000))"
[ "$CLAUDE_MD_COUNT" -gt 0 ] && printf " ${DIM}|${RST} ${DIM}%d CLAUDE.md${RST}" "$CLAUDE_MD_COUNT"
[ "$MCP_COUNT" -gt 0 ] && printf " ${DIM}|${RST} ${DIM}%d MCPs${RST}" "$MCP_COUNT"
[ "$HOOKS_COUNT" -gt 0 ] && printf " ${DIM}|${RST} ${DIM}%d Hooks${RST}" "$HOOKS_COUNT"

printf "\n${DIM}[5h]${RST} %s ${ACCT_CLR}%d%%${RST} ${DIM}|${RST} ${ACCT_CLR}%s${RST} ${DIM}|${RST} ${DIM}Resets in${RST} ${ACCT_CLR}%s${RST} ${DIM}| [7d]${RST} %s ${WEEK_CLR}%d%%${RST}" "$ACCT_BAR" "$ACCT_PCT" "$SPEED_STR" "$TIME_STR" "$WEEK_BAR" "$WEEK_PCT"

if [ -n "$TODO_TEXT" ]; then
  printf "\n${YELLOW}▸${RST} %s ${DIM}%s${RST}" "$TODO_TEXT" "$TODO_COUNT"
elif [ -n "$TODO_COUNT" ]; then
  printf "\n${GREEN}✓${RST} ${DIM}All tasks complete %s${RST}" "$TODO_COUNT"
fi
