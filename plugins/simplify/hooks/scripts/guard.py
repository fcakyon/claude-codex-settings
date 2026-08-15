#!/usr/bin/env python3
"""Block `git commit` until /simplify runs or the user requests a one-time bypass.

The marker lives in the per-worktree Git directory because /simplify reviews
the worktree's index. Claude Code and Codex mint it through an explicit
completion signal carrying the reviewed worktree. An agent can mint the same
one-use permission when the user explicitly asks to skip /simplify. Other
runtimes remain unblocked because they have no supported path.
"""

import json
import os
import shlex
import subprocess
import sys
from pathlib import Path

data = json.load(sys.stdin)
event = data.get("hook_event_name", "")
tool_input = data.get("tool_input") or {}

COMPLETION_SIGNAL = ("echo", "simplify-guard:complete")
BYPASS_SIGNAL = ("echo", "simplify-guard:bypass")
SHELL_OPERATORS = {";", "&&", "||", "|", "(", ")"}
GIT_OPTIONS_WITH_VALUES = {"-C", "-c", "--config-env", "--git-dir", "--namespace", "--work-tree"}
GIT_OPTIONS_WITHOUT_SUBCOMMAND = {
    "-h",
    "--exec-path",
    "--help",
    "--html-path",
    "--info-path",
    "--man-path",
    "--version",
}


def marker(git=("git",)):
    """Return the one-use marker for a Git worktree.

    Args:
        git (tuple[str, ...], optional): Git executable and global options.

    Returns:
        (Path | None): Marker path when the command resolves a Git directory.
    """
    git_dir = subprocess.run(
        [*git, "rev-parse", "--path-format=absolute", "--git-dir"],
        capture_output=True,
        cwd=data.get("cwd") or ".",
        text=True,
    ).stdout.strip()
    return Path(git_dir) / "simplify-guard.ok" if git_dir else None


def commit_prefix(tokens):
    """Return the safe Git prefix for a commit command.

    Args:
        tokens (list[str]): Shell tokens to inspect.

    Returns:
        (list[str] | None): Git executable and global options before `commit`.
    """
    for start, arg in enumerate(tokens):
        if Path(arg).name != "git":
            continue
        git = [arg]
        for token in tokens[start + 1 :]:
            if token in SHELL_OPERATORS:
                break
            if git[-1] in GIT_OPTIONS_WITH_VALUES:
                git.append(token)
            elif token == "commit":
                return git
            elif token in GIT_OPTIONS_WITHOUT_SUBCOMMAND or not token.startswith("-"):
                break
            else:
                git.append(token)


def main():
    """Run the guard for one hook event."""
    if event != "PreToolUse" or not (os.environ.get("CLAUDECODE") == "1" or data.get("turn_id")):
        return

    command = tool_input.get("command", "")
    lexer = shlex.shlex(command, posix=True, punctuation_chars=";&|()")
    lexer.whitespace_split = True
    tokens = list(lexer)
    if len(tokens) == 3 and tuple(tokens[:2]) == COMPLETION_SIGNAL:
        if m := marker(("git", "-C", tokens[2])):
            m.touch()
        return
    if tuple(tokens) == BYPASS_SIGNAL:
        if m := marker():
            m.touch()
        return

    if not (git := commit_prefix(tokens)) or not (m := marker(git)):
        return

    if m.exists():
        m.unlink()  # spend the token before Git runs. Every attempt needs a fresh review
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
