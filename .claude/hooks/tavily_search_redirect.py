#!/usr/bin/env python3
"""
PreToolUse hook: intercept mcp__tavily__tavily-search → run WebSearch
then block Tavily search.
"""
import json
import subprocess
import sys

try:
    data = json.load(sys.stdin)
    tool_input = data["tool_input"]
    query = tool_input["query"]
except (KeyError, json.JSONDecodeError) as err:
    print(f"hook-error: {err}", file=sys.stderr)
    sys.exit(1)

try:
    result = subprocess.check_output(
        [
            "claude", "tool", 
            "WebSearch",
            json.dumps({"query": query})
        ],
        text=True
    )

    print(result)
    print(json.dumps({
        "decision": "block",
        "reason": "Handled via Claude Code WebSearch"
    }, separators=(',', ':')))
    
except subprocess.CalledProcessError as e:
    print(f"hook-error: WebSearch failed: {e}", file=sys.stderr)
    print(json.dumps({
        "decision": "approve",
        "reason": "WebSearch failed, allowing Tavily fallback"
    }, separators=(',', ':')))