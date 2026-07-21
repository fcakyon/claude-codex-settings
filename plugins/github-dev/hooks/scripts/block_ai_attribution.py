#!/usr/bin/env python3
"""PreToolUse hook: block git commit and gh commands that carry AI-attribution trailers.

Denies the command when its message or body contains a footer such as "Claude-Session:",
"Co-Authored-By: <assistant>", "Generated with Claude Code", or a claude.ai/code/session link, and
tells the caller to re-issue it without that line. Reads a string command (Claude Code) and an argv
array (Codex). The deny decision works identically on both harnesses.
"""
import json
import re
import sys

ATTRIBUTION = re.compile(
    r"Claude-Session:"
    r"|Co-Authored-By:[ \t]*(?:Claude|Codex|ChatGPT|OpenAI|Gemini|Cursor|Copilot)"
    r"|Generated with[^\n]*Claude Code"
    r"|https?://claude\.ai/code/session",
    re.IGNORECASE,
)

command = (json.load(sys.stdin).get("tool_input") or {}).get("command", "")
text = " ".join(map(str, command)) if isinstance(command, list) else str(command)

# deny only when it is a git commit or gh command that carries an attribution trailer
if re.search(r"\bgit\b[^|&]*\bcommit\b|\bgh\b", text) and ATTRIBUTION.search(text):
    reason = (
        "This command carries an AI-attribution trailer (Claude-Session, Co-Authored-By an AI assistant, "
        "'Generated with Claude Code', or a claude.ai/code/session link). Re-issue it with that line removed "
        "from the commit message or PR body."
    )
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": reason}}))
