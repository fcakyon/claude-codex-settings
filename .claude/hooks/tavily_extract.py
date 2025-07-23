#!/usr/bin/env python3
"""
PreToolUse hook: intercept WebFetch → run tavily-extract
with extract_depth="advanced", then block WebFetch.
"""
import json, subprocess, sys

try:
    data = json.load(sys.stdin)
    url  = data["tool_input"]["url"]
except (KeyError, json.JSONDecodeError) as err:
    print(f"hook-error: {err}", file=sys.stderr)
    sys.exit(1)

payload = json.dumps({
    "urls": [url],
    "extract_depth": "advanced"
})

result = subprocess.check_output(
    [
        "claude", "tool",
        "mcp__tavily__tavily-extract",
        payload
    ],
    text=True
)

print(result)
print(json.dumps({
    "decision": "block",
    "reason": "Handled via tavily-extract with extract_depth=advanced"
}, separators=(',', ':')))
