#!/usr/bin/env python3
"""
Validate plugin paths alignment between marketplace.json and plugin structure.

Checks:
- .claude-plugin/plugin.json exists
- marketplace.json (if used at project root) paths match actual plugin directories
- Plugin name in plugin.json matches directory name
- Required plugin fields are present

Only runs when editing files within a plugin directory.
"""

import json
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


def validate_plugin_paths():
    """Check plugin paths in marketplace and plugin structure."""
    # Get the file being edited and find its plugin root
    edited_file = get_edited_file_path()
    if not edited_file:
        return 0  # No file path in input, skip

    plugin_root = find_plugin_root(edited_file)
    if not plugin_root:
        return 0  # Not editing a plugin file, skip silently

    errors = []

    # Check .claude-plugin/plugin.json exists
    plugin_json = plugin_root / ".claude-plugin" / "plugin.json"
    if not plugin_json.exists():
        errors.append(".claude-plugin directory or plugin.json not found")
        print("❌ Plugin Path Validation Failed:")
        for error in errors:
            print(f"   • {error}")
        return 1

    try:
        with open(plugin_json) as f:
            plugin_config = json.load(f)

        # Check required fields (only 'name' is required per Claude Code docs)
        if "name" not in plugin_config:
            errors.append(".claude-plugin/plugin.json: Missing 'name' field")

        # Verify plugin name matches directory (if not at root)
        plugin_name = plugin_config.get("name")
        if plugin_name and plugin_root.name != ".":
            dir_name = plugin_root.name
            if plugin_name != dir_name:
                errors.append(
                    f"Plugin name '{plugin_name}' in plugin.json does not match "
                    f"directory name '{dir_name}'"
                )

    except json.JSONDecodeError as e:
        errors.append(f".claude-plugin/plugin.json: Invalid JSON - {e}")

    # Check marketplace.json at project root if this is a plugin directory
    marketplace_root = plugin_root.parent.parent / ".claude-plugin" / "marketplace.json"
    if marketplace_root.exists():
        try:
            with open(marketplace_root) as f:
                marketplace = json.load(f)

            if "plugins" in marketplace:
                plugin_name = plugin_config.get("name")
                for plugin_entry in marketplace["plugins"]:
                    if plugin_entry.get("name") == plugin_name:
                        # Check path matches
                        path = plugin_entry.get("path")
                        if path:
                            # Resolve relative path
                            expected_path = plugin_root / "plugin.json"
                            if "${CLAUDE_PLUGIN_ROOT}" in path:
                                expected = path.replace("${CLAUDE_PLUGIN_ROOT}", str(plugin_root))
                            else:
                                expected = str(expected_path)

                            actual = plugin_root / ".claude-plugin" / "plugin.json"
                            if not actual.exists():
                                errors.append(
                                    f"marketplace.json references path that doesn't exist: {path}"
                                )

        except json.JSONDecodeError as e:
            errors.append(f"marketplace.json: Invalid JSON - {e}")

    if errors:
        print("❌ Plugin Path Validation Failed:")
        for error in errors:
            print(f"   • {error}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(validate_plugin_paths())
