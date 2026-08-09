#!/usr/bin/env python3
"""Block `git commit` until /simplify runs or the user requests a one-time bypass.

The marker lives in the per-worktree Git directory because /simplify reviews
the worktree's index. Claude Code mints it through the Skill event; Codex mints
it through the explicit completion signal at the end of the skill. An agent can
mint the same one-use permission when the user explicitly asks to skip
/simplify. Other runtimes remain unblocked because they have no supported path.
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

COMPLETION_SIGNAL = "echo simplify-guard:complete"
BYPASS_SIGNAL = "echo simplify-guard:bypass"
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
    git_dir = subprocess.run(
        [*git, "rev-parse", "--path-format=absolute", "--git-dir"],
        capture_output=True,
        cwd=data.get("cwd") or ".",
        text=True,
    ).stdout.strip()
    return Path(git_dir) / "simplify-guard.ok" if git_dir else None


def session_marker():
    """Fallback for when the session cwd is not a Git repository at all.

    The per-worktree marker above stays the primary, but minting it resolves a git dir
    from the SESSION cwd, and that fails outright when the session runs from a plain
    directory that merely contains checkouts, for example a home directory holding
    several worktrees. In that layout /simplify can never arm the guard: the mint is a
    silent no-op while the PreToolUse check still resolves the correct per-worktree path
    and denies. Every commit is refused no matter how many reviews ran, and the only way
    through is to create the marker by hand, which defeats the guard.

    Keyed by session id where the runtime supplies one, so concurrent sessions cannot
    spend each other's token. Still consumed on every commit attempt, so the one review
    per commit rule is unchanged.
    """
    session = str(data.get("session_id") or data.get("sessionId") or "shared")
    safe = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in session)[:64]
    directory = Path.home() / ".claude" / "simplify-guard"
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except OSError:
        return None
    return directory / ("%s.ok" % safe)


def commit_prefix(command):
    lexer = shlex.shlex(command, posix=True, punctuation_chars=";&|()")
    lexer.whitespace_split = True
    tokens = list(lexer)
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
    is_claude = os.environ.get("CLAUDECODE") == "1"
    is_codex = bool(data.get("turn_id"))

    if event == "PostToolUse":
        # Mint both. The per-worktree marker is the precise one and is preferred when
        # spending, the session marker only carries the review when the session cwd is
        # not a repo and the precise path cannot be resolved at all.
        if is_claude and tool_input.get("skill") == "simplify":
            for m in (marker(), session_marker()):
                if m:
                    m.touch()
        return

    if event != "PreToolUse" or not (is_claude or is_codex):
        return

    command = tool_input.get("command", "")
    signal = command.strip()
    if signal == BYPASS_SIGNAL or (is_codex and signal == COMPLETION_SIGNAL):
        for m in (marker(), session_marker()):
            if m:
                m.touch()
        return

    if not (git := commit_prefix(command)):
        return

    # Prefer the worktree this commit targets, fall back to the session marker.
    spend = next((m for m in (marker(git), session_marker()) if m and m.exists()), None)

    if spend:
        spend.unlink()  # spend the token before Git runs; every attempt needs a fresh review
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
