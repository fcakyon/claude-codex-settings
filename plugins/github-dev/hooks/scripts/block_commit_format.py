#!/usr/bin/env python3
"""PreToolUse hook: block commit messages without an allowed type or a verification trailer, as commit-staged lists."""

import json
import re
import sys

from commit_message import git_commits

TYPES = ("feat", "fix", "refactor", "docs", "style", "test", "build")

data = json.load(sys.stdin)
for args, message in git_commits((data.get("tool_input") or {}).get("command", ""), data.get("cwd") or "."):
    subject = next((line.strip() for line in message.splitlines() if line.strip()), "")
    if not subject:
        continue
    if not re.match(rf"^(?:{'|'.join(TYPES)}): \S", subject):
        reason = (
            f'"{subject.split(":", 1)[0][:20]}" is not an allowed commit type. Use one of {", ".join(TYPES)}, '
            "written as type then a colon then a brief description. Pick the type that fits and commit again."
        )
        break
    # git writes each --trailer as key: value into the closing paragraph, which must follow the subject paragraph
    trailers = [value for flag, value in zip(args, args[1:]) if flag == "--trailer"]
    trailers += [arg.removeprefix("--trailer=") for arg in args if arg.startswith("--trailer=")]
    closing = re.split(r"\n\s*\n", message.strip())[1:][-1:] + [
        re.sub(r"\s*[=:]\s*", ": ", t, count=1) for t in trailers
    ]
    if not re.search(r"^verification: \S", "\n".join(closing), re.MULTILINE):
        reason = (
            "End the commit message with a lowercase verification: trailer after a blank line, naming the checks "
            "that ran on these changes and their results. If none ran, write verification: none (<reason>)."
        )
        break
else:
    sys.exit(0)

print(
    json.dumps(
        {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }
        }
    )
)
