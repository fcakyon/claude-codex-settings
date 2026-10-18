#!/usr/bin/env python3
"""PreToolUse hook: block commit types outside the set the commit-staged skill lists."""
import json
import re
import sys

TYPES = ("feat", "fix", "refactor", "docs", "style", "test", "build")
GIT_COMMIT = re.compile(r"(?:^|&&|\|\||;|\n)\s*git\s+(?:-C\s+\S+\s+)?commit\b")
# Same heredoc and separator patterns as the humanize hook
HEREDOC = re.compile(r"<<-?[ \t]*[\"']?([A-Za-z_]\w*)[\"']?([^\n]*)\r?\n(.*?)\r?\n[ \t]*\1[ \t]*$", re.DOTALL | re.MULTILINE)
SEPARATOR = re.compile(r"\|\||&&|[\n;|&]")

raw = (json.load(sys.stdin).get("tool_input") or {}).get("command", "")
argv = [str(a) for a in raw] if isinstance(raw, list) else None
text = " ".join(argv) if argv else str(raw)

# Heredoc bodies are data, so only the shell around them can run a commit
shell = HEREDOC.sub(r" \2", text)
commit = GIT_COMMIT.search(shell)
if not commit:
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
    # A heredoc that git commit opens wins, any other heredoc is file content. Otherwise take the
    # first -m value after git commit. The quote is captured and backreferenced so an apostrophe
    # inside a double-quoted message does not end it early.
    message = next(
        (
            m.group(3)
            for m in HEREDOC.finditer(text)
            if GIT_COMMIT.search(SEPARATOR.split(text[: m.start()])[-1] + SEPARATOR.split(m.group(2))[0])
        ),
        "",
    )
    if not message:
        quoted = re.findall(r"""(?:-m|--message)[=\s]+("|')(.*?)\1""", shell[commit.start() :], re.DOTALL)
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
