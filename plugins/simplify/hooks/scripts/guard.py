#!/usr/bin/env python3
"""Block `git commit` until /simplify runs. Each commit spends one /simplify.

The marker lives in the per-worktree git dir (`git rev-parse --git-dir`): /simplify reviews the
staged diff and the index is per-worktree, so the token is minted and spent in the same worktree
any session or subagent commits from. /simplify mints via the Skill tool, which only Claude Code
fires, so the commit deny is scoped to Claude Code, other harnesses that can never mint are not
blocked.
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


def marker():
    git_dir = subprocess.run(
        ["git", "-C", data.get("cwd") or ".", "rev-parse", "--path-format=absolute", "--git-dir"],
        capture_output=True,
        text=True,
    ).stdout.strip()
    return Path(git_dir) / "simplify-guard.ok" if git_dir else None


# PostToolUse matcher scopes to the Skill tool, confirm it was /simplify
if event == "PostToolUse" and tool_input.get("skill") == "simplify" and (m := marker()):
    m.touch()
elif event == "PreToolUse" and os.environ.get("CLAUDECODE") == "1":
    # match a real `git commit` (not commit-graph/-tree) with quoted args stripped
    bare = re.sub(r"'[^']*'|\"[^\"]*\"", "", tool_input.get("command", ""))
    if re.search(r"git\s+commit(?![\w-])", bare) and (m := marker()):
        if m.exists():
            m.unlink()  # spend the token: this commit uses up the pending /simplify
        else:
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
