#!/usr/bin/env python3
"""Block `git commit` until /simplify runs. Each commit attempt spends one /simplify.

The marker lives in the per-worktree Git directory because /simplify reviews
the worktree's index. Claude Code mints it through the Skill event; Codex mints
it through the explicit completion signal at the end of the skill. Other
runtimes remain unblocked because they have no supported completion path.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

data = json.load(sys.stdin)
event = data.get("hook_event_name", "")
tool_input = data.get("tool_input") or {}

COMPLETION_SIGNAL = "echo simplify-guard:complete"


def marker():
    git_dir = subprocess.run(
        [
            "git",
            "-C",
            data.get("cwd") or ".",
            "rev-parse",
            "--path-format=absolute",
            "--git-dir",
        ],
        capture_output=True,
        text=True,
    ).stdout.strip()
    return Path(git_dir) / "simplify-guard.ok" if git_dir else None


def main():
    is_claude = os.environ.get("CLAUDECODE") == "1"
    is_codex = bool(data.get("turn_id"))

    if event == "PostToolUse":
        if is_claude and tool_input.get("skill") == "simplify" and (m := marker()):
            m.touch()
        return

    if event != "PreToolUse" or not (is_claude or is_codex):
        return

    command = tool_input.get("command", "")
    if is_codex and command.strip() == COMPLETION_SIGNAL:
        if m := marker():
            m.touch()
        return

    bare = re.sub(r"'[^']*'|\"[^\"]*\"", "", command)
    if not re.search(r"git\s+commit(?![\w-])", bare) or not (m := marker()):
        return

    if m.exists():
        m.unlink()  # spend the token before Git runs; every attempt needs a fresh review
        return

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


main()
