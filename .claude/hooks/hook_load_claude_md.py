#!/usr/bin/env python3
"""
UserPromptSubmit hook: Read CLAUDE.md or AGENTS.md from project directory and inject as context at each prompt.
"""
import json
import sys
import os
from pathlib import Path

def find_claude_md(project_dir):
    """Find CLAUDE.md or AGENTS.md in the project directory."""
    claude_md = Path(project_dir) / "CLAUDE.md"
    agents_md = Path(project_dir) / "AGENTS.md"

    if claude_md.exists():
        return claude_md
    elif agents_md.exists():
        return agents_md
    return None

try:
    input_data = json.load(sys.stdin)
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", input_data.get("cwd", ""))

    if not project_dir:
        sys.exit(0)

    claude_md_path = find_claude_md(project_dir)

    if not claude_md_path:
        sys.exit(0)

    # Read CLAUDE.md content
    try:
        with open(claude_md_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()

        if not content:
            sys.exit(0)

        # Output the content to be added as context
        print(f"Project instructions from {claude_md_path.name}:\n\n{content}")
        sys.exit(0)

    except Exception as e:
        print(f"Error reading {claude_md_path}: {e}", file=sys.stderr)
        sys.exit(1)

except Exception as e:
    print(f"hook-error: {e}", file=sys.stderr)
    sys.exit(1)