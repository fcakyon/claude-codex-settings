#!/usr/bin/env python3
"""Intercept mcp__tavily__tavily-extract to upgrade extract_depth and suggest gh CLI for GitHub URLs."""

import json
import sys

try:
    data = json.load(sys.stdin)
    tool_input = data["tool_input"]
    urls = tool_input.get("urls", [])

    # Always ensure extract_depth="advanced"
    tool_input["extract_depth"] = "advanced"

    # Check for GitHub URLs and add soft suggestion
    github_domains = ("github.com", "raw.githubusercontent.com", "gist.github.com")
    github_urls = [url for url in urls if any(domain in url for domain in github_domains)]

    if github_urls:
        # Allow but suggest GitHub MCP/gh CLI for next time
        print(
            json.dumps(
                {
                    "systemMessage": "Tip: For GitHub URLs, use gh CLI: `gh api repos/{owner}/{repo}/contents/{path} --jq '.content' | base64 -d` for files, `gh pr view` for PRs, `gh issue view` for issues.",
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "allow",
                        "updatedInput": tool_input,
                    },
                },
                separators=(",", ":"),
            )
        )
        sys.exit(0)

    # Allow the call to proceed
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "allow",
                    "updatedInput": tool_input,
                }
            },
            separators=(",", ":"),
        )
    )
    sys.exit(0)

except (KeyError, json.JSONDecodeError) as err:
    print(f"hook-error: {err}", file=sys.stderr)
    sys.exit(1)
