#!/usr/bin/env python3
"""
UserPromptSubmit hook: Read CLAUDE.md from home directory and CLAUDE.md/AGENTS.md from project directory.
"""
import json
import sys
import os
from pathlib import Path

def find_home_claude_md():
    """Find CLAUDE.md in home directory."""
    home_claude_md = Path.home() / ".claude" / "CLAUDE.md"
    return home_claude_md if home_claude_md.exists() else None

def find_project_claude_md(project_dir):
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

    # Load home CLAUDE.md
    home_path = find_home_claude_md()
    home_content = ""
    if home_path:
        try:
            with open(home_path, 'r', encoding='utf-8') as f:
                home_content = f.read().strip()
        except Exception as e:
            print(f"Error reading {home_path}: {e}", file=sys.stderr)

    # Load project CLAUDE.md/AGENTS.md
    project_content = ""
    if project_dir:
        project_path = find_project_claude_md(project_dir)
        if project_path:
            try:
                with open(project_path, 'r', encoding='utf-8') as f:
                    project_content = f.read().strip()
            except Exception as e:
                print(f"Error reading {project_path}: {e}", file=sys.stderr)

    # Combine content
    output_parts = []
    if home_content:
        output_parts.append(f"Global instructions from ~/.claude/CLAUDE.md:\n\n{home_content}")
    if project_content:
        output_parts.append(f"Project instructions from {project_path.name}:\n\n{project_content}")

    if output_parts:
        print("\n\n---\n\n".join(output_parts))
        sys.exit(0)
    else:
        sys.exit(0)

except Exception as e:
    print(f"hook-error: {e}", file=sys.stderr)
    sys.exit(1)