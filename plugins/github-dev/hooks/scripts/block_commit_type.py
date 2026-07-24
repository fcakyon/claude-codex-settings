#!/usr/bin/env python3
"""PreToolUse hook: block commit types outside the set the commit-staged skill lists."""
import json
import re
import sys

TYPES = ("feat", "fix", "refactor", "docs", "style", "test", "build")

raw = (json.load(sys.stdin).get("tool_input") or {}).get("command", "")
argv = [str(a) for a in raw] if isinstance(raw, list) else None
text = " ".join(argv) if argv else str(raw)

if not re.search(r"(?:^|&&|\|\||;|\n)\s*git\s+(?:-C\s+\S+\s+)?commit\b", text):
    sys.exit(0)

message = ""
if argv:
    # Codex hands over an argv array, where the message is its own element and carries no quotes
    for i, arg in enumerate(argv):
        if arg.startswith("--message="):
            message = arg.split("=", 1)[1]
            break
        if arg in ("-m", "--message") and i + 1 < len(argv):
            message = argv[i + 1]
            break
else:
    # A heredoc body wins when present, otherwise take the first -m value. The quote is captured
    # and backreferenced so an apostrophe inside a double-quoted message does not end it early.
    heredoc = re.search(r"<<\s*'?EOF'?\s*\n(.*?)\n\s*EOF", text, re.DOTALL)
    if heredoc:
        message = heredoc.group(1)
    else:
        quoted = re.findall(r"""(?:-m|--message)[=\s]+("|')(.*?)\1""", text, re.DOTALL)
        message = quoted[0][1] if quoted else ""

if not message:
    sys.exit(0)

subject = next((line.strip() for line in message.splitlines() if line.strip()), "")
if not subject or re.match(rf"^(?:{'|'.join(TYPES)}): \S", subject):
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
