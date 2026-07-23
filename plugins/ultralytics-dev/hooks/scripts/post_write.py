#!/usr/bin/env python3
"""Run file formatters for every path changed by a write tool."""

import json
import re
import subprocess
import sys
from pathlib import Path

FORMATTERS = {
    ".py": ("format_python_docstrings.py", "python_code_quality.py"),
    ".md": ("markdown_formatting.py",),
    ".sh": ("bash_formatting.py",),
    ".bash": ("bash_formatting.py",),
    **{
        suffix: ("prettier_formatting.py",)
        for suffix in (
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".css",
            ".less",
            ".scss",
            ".json",
            ".yml",
            ".yaml",
            ".html",
            ".vue",
            ".svelte",
        )
    },
}


def changed_paths(data: dict) -> list[str]:
    """Return changed file paths from Claude writes or Codex patches.

    Args:
        data (dict): Hook input payload.

    Returns:
        (list[str]): Changed file paths.
    """
    tool_input = data.get("tool_input") or {}
    if file_path := tool_input.get("file_path"):
        return [file_path]
    return re.findall(
        r"^\*\*\* (?:Add|Update) File: (.+?)\s*$",
        tool_input.get("command", ""),
        re.MULTILINE,
    )


def main() -> None:
    """Run each formatter with one normalized file path."""
    data = json.load(sys.stdin)
    messages = []
    for file_path in dict.fromkeys(changed_paths(data)):
        payload = json.dumps(
            {
                **data,
                "tool_input": {
                    **(data.get("tool_input") or {}),
                    "file_path": file_path,
                },
            }
        )
        for formatter in FORMATTERS.get(Path(file_path).suffix.lower(), ()):
            result = subprocess.run(
                [sys.executable, str(Path(__file__).with_name(formatter))],
                input=payload,
                capture_output=True,
                text=True,
            )
            messages.extend(
                part for part in (result.stdout.strip(), result.stderr.strip()) if part
            )
    if messages:
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PostToolUse",
                        "additionalContext": "\n".join(messages),
                    }
                }
            )
        )


if __name__ == "__main__":
    main()
