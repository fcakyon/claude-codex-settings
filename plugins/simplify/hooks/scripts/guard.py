#!/usr/bin/env python3
"""Block `git commit` until /simplify ran this session.

Per-session marker under TMPDIR (keyed by session_id), so a new session re-requires /simplify.
Harness-agnostic hook contract, so Codex, which installs this plugin's /simplify, is guarded too.
"""
import json
import os
import re
import sys
from pathlib import Path

data = json.load(sys.stdin)
event = data.get("hook_event_name", "")
session_id = data.get("session_id") or "nosession"
marker = Path(os.environ.get("TMPDIR", "/tmp")) / "simplify-guard" / f"{session_id}.ok"
tool_input = data.get("tool_input") or {}

if event == "PostToolUse":  # matcher scopes to the Skill tool; confirm it was /simplify
    if tool_input.get("skill") == "simplify" or tool_input.get("name") == "simplify":
        marker.parent.mkdir(parents=True, exist_ok=True)
        marker.touch()
elif event == "PreToolUse":  # matcher scopes to Bash; self-filter to `git commit` (not commit-graph/-tree)
    if re.search(r"git\s+commit(?![\w-])", tool_input.get("command", "")) and not marker.exists():
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "deny",
                        "permissionDecisionReason": "simplify-guard: run /simplify on the staged diff first, then retry the commit.",
                    }
                }
            )
        )
