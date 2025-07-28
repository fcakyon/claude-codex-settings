#!/usr/bin/env python3
"""
PreToolUse hook: intercept mcp__tavily__tavily-extract and add
extract_depth="advanced" if not already set.
"""
import json, sys

try:
    data = json.load(sys.stdin)
    tool_input = data["tool_input"]

    # Always ensure extract_depth="advanced"
    tool_input["extract_depth"] = "advanced"

    # Allow the call to proceed
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow",
            "permissionDecisionReason": "Automatically upgrading Tavily extract to advanced mode for better content extraction"
        }
    }, separators=(',', ':')))
    sys.exit(0)

except (KeyError, json.JSONDecodeError) as err:
    print(f"hook-error: {err}", file=sys.stderr)
    sys.exit(1)