#!/usr/bin/env python3
"""PreToolUse hook: block commit types outside the set the commit-staged skill lists."""
import json
import re
import sys

from commit_message import git_commits

TYPES = ("feat", "fix", "refactor", "docs", "style", "test", "build")

data = json.load(sys.stdin)
for _, message in git_commits((data.get("tool_input") or {}).get("command", ""), data.get("cwd") or "."):
    subject = next((line.strip() for line in message.splitlines() if line.strip()), "")
    if subject and not re.match(rf"^(?:{'|'.join(TYPES)}): \S", subject):
        break
else:
    sys.exit(0)

used = subject.split(":", 1)[0][:20]
reason = (
    f'"{used}" is not an allowed commit type. Use one of {", ".join(TYPES)}, '
    "written as type then a colon then a brief description. Pick the type that fits and commit again."
)
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
