#!/usr/bin/env python3
"""
PreToolUse hook: intercept mcp__tavily__tavily-extract
- Block GitHub URLs and suggest using GitHub MCP tools instead
- Otherwise, upgrade extract_depth to "advanced"
"""
import json
import sys

try:
    data = json.load(sys.stdin)
    tool_input = data["tool_input"]
    urls = tool_input.get("urls", [])

    # Check for GitHub URLs
    github_domains = ("github.com", "raw.githubusercontent.com", "gist.github.com")
    github_urls = [url for url in urls if any(domain in url for domain in github_domains)]

    if github_urls:
        # Block and suggest GitHub MCP tools
        print(json.dumps({
            "systemMessage": "GitHub URL detected in Tavily extract tool. AI is directed to use GitHub MCP tools instead.",
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "GitHub URL detected. Please use GitHub MCP tools (mcp__github__*) for more robust data retrieval."
            },
        }, separators=(',', ':')))
        sys.exit(2)

    # Always ensure extract_depth="advanced" for non-GitHub URLs
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