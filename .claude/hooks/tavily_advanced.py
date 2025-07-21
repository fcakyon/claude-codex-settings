#!/usr/bin/env python3
"""
PreToolUse hook: intercept mcp__tavily__tavily-extract and add
extract_depth="advanced" if not already set.
"""
import json, sys

try:
    data = json.load(sys.stdin)
    tool_input = data["tool_input"]

    # Add extract_depth="advanced" if not already set
    if "extract_depth" not in tool_input:
        tool_input["extract_depth"] = "advanced"

    # Output the modified tool input and allow the call to proceed
    print(json.dumps({
        "decision": "allow",
        "modified_tool_input": tool_input
    }))

except (KeyError, json.JSONDecodeError) as err:
    print(f"hook-error: {err}", file=sys.stderr)
    sys.exit(1)