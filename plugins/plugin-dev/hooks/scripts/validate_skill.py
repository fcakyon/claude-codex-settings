#!/usr/bin/env python3
"""Validate SKILL.md files for structure, name format, and description length."""

import json
import os
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


def get_edited_file_path():
    """Extract file path from hook input."""
    try:
        input_data = json.load(sys.stdin)
        return input_data.get("tool_input", {}).get("file_path", "")
    except (json.JSONDecodeError, KeyError):
        return ""


def validate_skill():
    """Validate all SKILL.md files in skills directory."""
    edited_path = get_edited_file_path()

    # Exit early if not editing a skill-related file
    if edited_path and "/skills/" not in edited_path and not edited_path.endswith("SKILL.md"):
        return 0

    errors = []
    plugin_root = Path(os.environ.get("CLAUDE_PLUGIN_ROOT", "."))
    skills_dir = plugin_root / "skills"

    if not skills_dir.exists():
        return 0

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
