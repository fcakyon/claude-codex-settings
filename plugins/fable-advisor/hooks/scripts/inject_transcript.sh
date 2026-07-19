#!/usr/bin/env bash
#
# inject_transcript.sh
#
# Fires on SubagentStart for the fable-advisor agent. The built-in advisor
# tool auto-forwards the whole conversation to the reviewer model, but a
# plugin subagent normally sees only the caller's prompt, which the main
# agent tends to shrink to a few bullet points. That leaves the advisor
# reviewing missing or wrong context.
#
# This hook closes the gap: it reads the SubagentStart payload from stdin,
# pulls transcript_path, renders a compact text view of the recent turns
# with jq, and returns it via hookSpecificOutput.additionalContext so the
# reviewer starts with the real conversation.
#
# jq drives every step (parsing the payload, rendering, and building the
# output). When jq is missing the transcript_path lookup yields empty and
# the script exits 0 without adding context, so a jq-less machine is a
# clean no-op rather than an error. It also adds nothing when there is no
# transcript to show.

set -euo pipefail

payload="$(cat)"
transcript_path="$(printf '%s' "$payload" | jq -r '.transcript_path // empty' 2> /dev/null || true)"

emit() {
  jq -cn --arg ctx "$1" '{hookSpecificOutput: {hookEventName: "SubagentStart", additionalContext: $ctx}}'
}

# Nothing to add when the transcript is absent (this also covers jq missing).
if [ -z "${transcript_path:-}" ] || [ ! -f "$transcript_path" ]; then
  exit 0
fi

pointer="The full conversation transcript for this session is at:
$transcript_path
Read it (JSONL, newest turns at the end) to reconstruct the context before reviewing."

# Render the last turns. fromjson? skips a half-written trailing line (the
# transcript lags and may be mid-write); try/catch empty drops any single
# record that fails to render instead of losing the whole window.
recent="$(jq -n -R -r '
  def clip($n): if (. | length) > $n then (.[0:$n] + " …[truncated]") else . end;
  def blocktext($role):
    if .type == "text" then $role + ": " + ((.text // "") | clip(4000))
    elif .type == "thinking" then "assistant (thinking): " + ((.thinking // "") | clip(1200))
    elif .type == "tool_use" then "assistant → " + (.name // "?") + "(" + ((.input // {}) | tojson | clip(280)) + ")"
    elif .type == "tool_result" then
      "  ↳ result: " + (( .content
        | if type == "string" then .
          elif type == "array" then ([.[] | (.text // "")] | join(" "))
          else tojson end ) | clip(700))
    else "" end;
  [ inputs | fromjson?
    | select(.isSidechain != true and (.isMeta != true))
    | select(.type == "user" or .type == "assistant")
    | ( try (
          .type as $role
          | .message.content as $c
          | if ($c | type) == "string" then ($role + ": " + ($c | clip(4000)))
            else ([ $c[] | blocktext($role) ] | map(select(. != "")) | join("\n")) end
        ) catch empty )
    | select(. != "") ]
  | .[-80:] | join("\n\n---\n\n")
' "$transcript_path" 2> /dev/null || true)"

if [ -z "$recent" ]; then
  emit "$pointer"
  exit 0
fi

# Safety cap: keep the most recent characters so a very chatty session cannot
# flood the reviewer's context. The newest turns are at the end, so keep the tail.
max=160000
if [ "${#recent}" -gt "$max" ]; then
  recent="…[older turns truncated for length]
${recent: -max}"
fi

emit "You are reviewing an in-progress Claude Code session. Below is the recent conversation, most recent last, the same history the built-in advisor tool would see. Weigh the specific question in the caller's prompt against this actual context, not just the caller's summary of it.

<recent-conversation>
$recent
</recent-conversation>

The complete raw transcript, including earlier turns not shown above, is at:
$transcript_path
Read it only if one specific earlier detail is load-bearing for your verdict."

exit 0
