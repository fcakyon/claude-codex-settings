#!/usr/bin/env python3
"""
Validate MCP and hook file locations in plugin.

Checks:
- .mcp.json exists at plugin root if referenced in plugin.json
- hooks/hooks.json exists if hooks are configured
- Hook scripts referenced in hooks.json exist
- File paths use ${CLAUDE_PLUGIN_ROOT} variable reference

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


def validate_mcp_hook_locations():
    """Check MCP and hook file locations."""
    # Get the file being edited and find its plugin root
    edited_file = get_edited_file_path()
    if not edited_file:
        return 0  # No file path in input, skip

    plugin_root = find_plugin_root(edited_file)
    if not plugin_root:
        return 0  # Not editing a plugin file, skip silently

    errors = []

    # Check .mcp.json if referenced in plugin.json
    plugin_json = plugin_root / ".claude-plugin" / "plugin.json"
    if plugin_json.exists():
        try:
            with open(plugin_json) as f:
                plugin_config = json.load(f)

            # Check if MCPs are mentioned in plugin description
            if "mcp" in plugin_config or "mcp" in str(plugin_config.get("description", "")).lower():
                mcp_config = plugin_root / ".mcp.json"
                if not mcp_config.exists():
                    errors.append(".mcp.json not found (mentioned in plugin.json)")

        except json.JSONDecodeError as e:
            errors.append(f".claude-plugin/plugin.json: Invalid JSON - {e}")

    # Check hooks.json if exists
    hooks_json = plugin_root / "hooks" / "hooks.json"
    if hooks_json.exists():
        try:
            with open(hooks_json) as f:
                hooks_config = json.load(f)

            if "hooks" in hooks_config:
                # Check all referenced script files
                for hook_list in hooks_config["hooks"].values():
                    if not isinstance(hook_list, list):
                        continue

                    for hook_entry in hook_list:
                        if not isinstance(hook_entry, dict):
                            continue

                        hooks = hook_entry.get("hooks", [])
                        if not isinstance(hooks, list):
                            continue

                        for hook in hooks:
                            if hook.get("type") == "command":
                                cmd = hook.get("command", "")

                                # Check if using variable reference
                                if cmd and not cmd.startswith("${CLAUDE_PLUGIN_ROOT}"):
                                    if Path(cmd).is_absolute():
                                        errors.append(
                                            f"hooks/hooks.json: Absolute path '{cmd}' "
                                            "should use ${CLAUDE_PLUGIN_ROOT} variable"
                                        )

                                # Expand path and check file exists
                                if cmd and "${CLAUDE_PLUGIN_ROOT}" in cmd:
                                    expanded = cmd.replace("${CLAUDE_PLUGIN_ROOT}", str(plugin_root))
                                    if not Path(expanded).exists():
                                        errors.append(f"hooks/hooks.json: Referenced script not found: {cmd}")

        except json.JSONDecodeError as e:
            errors.append(f"hooks/hooks.json: Invalid JSON - {e}")

    if errors:
        print("❌ MCP/Hook Location Validation Failed:")
        for error in errors:
            print(f"   • {error}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(validate_mcp_hook_locations())
