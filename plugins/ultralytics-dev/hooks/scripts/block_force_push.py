#!/usr/bin/env python3
"""PreToolUse hook: block force-push and rebase, which rewrite shared history.

Denies git push force forms (--force, -f, --force-with-lease, a leading + on a refspec) and git
rebase, telling the caller to add a follow-up commit or a fresh branch instead. Reads a string
command (Claude Code) and an argv array (Codex). Quoted text is stripped first so a force flag
mentioned inside a commit message or PR body does not trip the guard. The deny decision works
identically on both harnesses.
"""
import json
import re
import sys

command = (json.load(sys.stdin).get("tool_input") or {}).get("command", "")
text = " ".join(map(str, command)) if isinstance(command, list) else str(command)
# drop quoted argument bodies so a force flag inside a message or body is not matched
bare = re.sub(r"'[^']*'|\"[^\"]*\"", "", text)

# scope the force flag to the git push clause, allowing options like -C between git and push, so a -f on
# another command in a compound line does not trip it. A leading + on a refspec also force-pushes
force_push = re.search(
    r"\bgit\b[^|&;\n]*\bpush\b[^|&;\n]*(?:--force(?:-with-lease|-if-includes)?\b|(?<![\w-])-\w*f(?![\w-])|(?<![\w+])\+\w)",
    bare,
)
rebase = re.search(r"\bgit\s+rebase\b", bare)
if force_push or rebase:
    reason = (
        "Force-push and rebase rewrite shared history and are blocked here. Add a follow-up commit "
        "instead of amending, or open a fresh branch. Run the rebase yourself if it is truly needed."
    )
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": reason}}))
