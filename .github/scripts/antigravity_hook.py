#!/usr/bin/env python3
"""Run Claude Code hook commands for an Antigravity tool call and answer in Antigravity's decision format."""

from __future__ import annotations

import json
import os
import subprocess
import sys

TOOLS = {
    "run_command": "Bash",
    "write_file": "Write",
    "write_to_file": "Write",
    "edit_file": "Edit",
    "replace_file_content": "Edit",
    "multi_replace_file_content": "MultiEdit",
}


def tool_input(tool: str, args: dict) -> dict:
    """Convert Antigravity tool arguments to the Claude Code tool_input the hook scripts read.

    Args:
        tool (str): Claude Code tool name.
        args (dict): Antigravity tool arguments.

    Returns:
        (dict): Claude Code tool_input with command, file_path, content, old_string, new_string or edits.
    """
    if tool == "Bash":
        return {"command": args.get("CommandLine", "")}
    path = args.get("Path") or args.get("TargetFile", "")
    if tool == "Write":
        return {"file_path": path, "content": args.get("Content", args.get("CodeContent", ""))}
    edits = [
        {
            "old_string": chunk.get("Target", chunk.get("TargetContent", "")),
            "new_string": chunk.get("Replacement", chunk.get("ReplacementContent", "")),
            "replace_all": chunk.get("AllowMultiple", False),
        }
        for chunk in args.get("ReplacementChunks") or [args]
    ]
    return {"file_path": path, "edits": edits} if tool == "MultiEdit" else {"file_path": path, **edits[0]}


def decide(command: str, payload: str, env: dict) -> tuple[str, str]:
    """Run one Claude Code hook command and read its permission decision.

    Args:
        command (str): Shell command of the hook.
        payload (str): Claude Code hook input JSON.
        env (dict): Environment for the hook process.

    Returns:
        decision (str): deny, ask, or allow.
        reason (str): Explanation from the hook, empty when it allows.
    """
    result = subprocess.run(command, shell=True, input=payload, capture_output=True, text=True, env=env)
    sys.stderr.write(result.stderr)
    if result.returncode == 2:
        return "deny", result.stderr.strip()
    answer = (json.loads(result.stdout) if result.stdout.strip().startswith("{") else {}).get(
        "hookSpecificOutput"
    ) or {}
    decision = answer.get("permissionDecision")
    return (decision, answer.get("permissionDecisionReason", "")) if decision in ("deny", "ask") else ("allow", "")


if __name__ == "__main__":
    data = json.load(sys.stdin)
    call = data.get("toolCall") or {}
    args = call.get("args") or {}
    tool = TOOLS.get(call.get("name"), call.get("name"))
    payload = json.dumps(
        {
            "hook_event_name": data.get("hookEventName"),
            "cwd": args.get("Cwd") or data.get("cwd"),
            "tool_name": tool,
            "tool_input": tool_input(tool, args),
        }
    )
    # agy started from a Claude Code session inherits CLAUDECODE, which turns on Claude-only ask prompts
    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
    # like Claude Code, a deny from any hook wins over an ask, and an ask over an allow, so stop at the first deny
    decision, reason = "allow", ""
    for command in sys.argv[1:]:
        answer = decide(command, payload, env)
        if answer[0] == "deny" or (answer[0] == "ask" and decision == "allow"):
            decision, reason = answer
        if decision == "deny":
            break
    print(json.dumps({"decision": decision, "reason": reason} if data.get("hookEventName") == "PreToolUse" else {}))
