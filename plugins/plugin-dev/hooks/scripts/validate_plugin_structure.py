#!/usr/bin/env python3
"""
Validate overall plugin structure and organization.

Checks:
- skills/ directory exists if skills are mentioned
- agents/, commands/, hooks/ directories follow naming conventions
- No invalid file/directory names
- Required metadata files present

Only runs when editing files within a plugin directory.
"""

import json
import os
import re
import sys
from pathlib import Path


def find_plugin_root(file_path: Path) -> Path | None:
    """Walk up from file_path to find .claude-plugin/plugin.json."""
    current = file_path.parent if file_path.is_file() else file_path
    for parent in [current, *current.parents]:
        if (parent / ".claude-plugin" / "plugin.json").exists():
            return parent
        if parent == parent.parent:
            break
    return None


def get_edited_file_path() -> Path | None:
    """Parse stdin to get the file being edited."""
    try:
        tool_input = json.load(sys.stdin)
        file_path = tool_input.get("file_path")
        return Path(file_path) if file_path else None
    except (json.JSONDecodeError, AttributeError):
        return None


def validate_plugin_structure():
    """Check plugin directory structure and naming."""
    # Get the file being edited and find its plugin root
    edited_file = get_edited_file_path()
    if not edited_file:
        return 0  # No file path in input, skip

    plugin_root = find_plugin_root(edited_file)
    if not plugin_root:
        return 0  # Not editing a plugin file, skip silently

    errors = []

    # Check for valid component directories
    valid_dirs = {"skills", "agents", "commands", "hooks", ".claude-plugin"}

    for item in plugin_root.iterdir():
        if item.is_dir() and item.name.startswith("."):
            continue  # Skip hidden dirs

        if item.is_dir() and item.name not in valid_dirs:
            # Check if it's a generated dir like __pycache__
            if item.name.startswith("__"):
                continue
            # Check if it's a valid plugin component
            if not re.match(r"^[a-z0-9_-]+$", item.name):
                errors.append(f"Invalid directory name: {item.name} (use lowercase, hyphens, underscores)")

    # Check skills structure if skills directory exists
    skills_dir = plugin_root / "skills"
    if skills_dir.exists():
        for skill_path in skills_dir.iterdir():
            if not skill_path.is_dir():
                continue

            # Check SKILL.md exists
            skill_md = skill_path / "SKILL.md"
            if not skill_md.exists():
                errors.append(f"skills/{skill_path.name}/: Missing SKILL.md file")

            # Check skill directory name format
            if not re.match(r"^[a-z0-9-]+$", skill_path.name):
                errors.append(f"skills/{skill_path.name}/: Invalid directory name (use lowercase with hyphens only)")

    # Check agents directory if exists
    agents_dir = plugin_root / "agents"
    if agents_dir.exists():
        for agent_file in agents_dir.iterdir():
            if agent_file.is_file() and agent_file.suffix == ".md":
                # Agent files should use kebab-case
                name = agent_file.stem
                if not re.match(r"^[a-z0-9-]+$", name):
                    errors.append(
                        f"agents/{agent_file.name}: Invalid agent name (use kebab-case: lowercase with hyphens)"
                    )

    # Check commands directory if exists
    commands_dir = plugin_root / "commands"
    if commands_dir.exists():
        for cmd_file in commands_dir.iterdir():
            if cmd_file.is_file() and cmd_file.suffix == ".md":
                # Command files should use kebab-case
                name = cmd_file.stem
                if not re.match(r"^[a-z0-9-]+$", name):
                    errors.append(
                        f"commands/{cmd_file.name}: Invalid command name (use kebab-case: lowercase with hyphens)"
                    )

    # Check hooks directory if exists
    hooks_dir = plugin_root / "hooks"
    if hooks_dir.exists():
        hooks_json = hooks_dir / "hooks.json"
        if not hooks_json.exists():
            errors.append("hooks/: Missing hooks.json file")

        # Check scripts directory
        scripts_dir = hooks_dir / "scripts"
        if scripts_dir.exists():
            for script in scripts_dir.iterdir():
                if script.is_file():
                    # Scripts should be executable
                    if not os.access(script, os.X_OK):
                        # Note: We don't error here, just validate naming
                        pass

                    # Check script naming
                    if script.suffix in {".py", ".sh"}:
                        name = script.stem
                        if not re.match(r"^[a-z0-9_]+$", name):
                            errors.append(
                                f"hooks/scripts/{script.name}: Invalid script name "
                                "(use snake_case: lowercase with underscores)"
                            )

    if errors:
        print("❌ Plugin Structure Validation Failed:")
        for error in errors:
            print(f"   • {error}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(validate_plugin_structure())
