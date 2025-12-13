#!/usr/bin/env python3
"""Validate SKILL.md files for structure, name format, and description length."""

import json
import re
import sys
from pathlib import Path


def parse_simple_yaml(text):
    """Parse simple key-value YAML frontmatter."""
    result = {}
    for line in text.strip().split("\n"):
        if ":" in line:
            key, _, value = line.partition(":")
            result[key.strip()] = value.strip().strip('"').strip("'")
    return result


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


def validate_skill():
    """Validate all SKILL.md files in skills directory."""
    edited_file = get_edited_file_path()
    if not edited_file:
        return 0

    # Skip virtual env, cache, and .claude directories
    edited_str = str(edited_file)
    if any(p in edited_str for p in [".venv", "venv", "site-packages", "__pycache__", ".claude/plugins/cache"]):
        return 0

    # Exit early if not editing a skill-related file
    if "/skills/" not in edited_str and not edited_str.endswith("SKILL.md"):
        return 0

    plugin_root = find_plugin_root(edited_file)
    if not plugin_root:
        return 0  # Not in a plugin directory

    skills_dir = plugin_root / "skills"
    if not skills_dir.exists():
        return 0

    errors = []

    for skill_path in skills_dir.iterdir():
        if not skill_path.is_dir():
            continue

        skill_md = skill_path / "SKILL.md"
        prefix = f"{skill_path.name}/SKILL.md"

        # Check SKILL.md exists
        if not skill_md.exists():
            errors.append(f"Missing SKILL.md in {skill_path.name}")
            continue

        # Read and parse file
        try:
            content = skill_md.read_text()
        except Exception as e:
            errors.append(f"{prefix}: Error reading file - {e}")
            continue

        # Check frontmatter markers
        if not content.startswith("---"):
            errors.append(f"{prefix}: Missing YAML frontmatter")
            continue

        parts = content.split("---", 2)
        if len(parts) < 3:
            errors.append(f"{prefix}: Invalid frontmatter format")
            continue

        # Parse YAML
        try:
            frontmatter = parse_simple_yaml(parts[1])
        except Exception as e:
            errors.append(f"{prefix}: Invalid YAML - {e}")
            continue

        if not frontmatter or not isinstance(frontmatter, dict):
            errors.append(f"{prefix}: Frontmatter must be valid YAML object")
            continue

        # Validate name field
        if "name" not in frontmatter:
            errors.append(f"{prefix}: Missing 'name' field")
        else:
            name = frontmatter["name"]
            if not isinstance(name, str):
                errors.append(f"{prefix}: 'name' must be a string")
            elif not name:
                errors.append(f"{prefix}: 'name' cannot be empty")
            else:
                if len(name) > 64:
                    errors.append(f"{prefix}: 'name' exceeds 64 characters ({len(name)})")
                if not re.match(r"^[a-z0-9]+(-[a-z0-9]+)*$", name):
                    errors.append(f"{prefix}: 'name' must use kebab-case: '{name}'")

        # Validate description field
        if "description" not in frontmatter:
            errors.append(f"{prefix}: Missing 'description' field")
        else:
            desc = frontmatter["description"]
            if not isinstance(desc, str):
                errors.append(f"{prefix}: 'description' must be a string")
            elif not desc:
                errors.append(f"{prefix}: 'description' cannot be empty")
            elif len(desc) > 300:
                errors.append(f"{prefix}: 'description' exceeds 300 characters ({len(desc)})")

    if errors:
        print("❌ Skill Validation Failed:", file=sys.stderr)
        for error in errors:
            print(f"   • {error}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(validate_skill())
