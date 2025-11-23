#!/usr/bin/env python3
"""
Validate MCP and hook file locations in plugin.

Checks:
- .mcp.json exists at plugin root if referenced in plugin.json
- hooks/hooks.json exists if hooks are configured
- Hook scripts referenced in hooks.json exist
- File paths use ${CLAUDE_PLUGIN_ROOT} variable reference
"""

import json
import os
import sys
from pathlib import Path


def validate_mcp_hook_locations():
    """Check MCP and hook file locations."""
    errors = []
    plugin_root = Path(os.environ.get("CLAUDE_PLUGIN_ROOT", "."))

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
                for hook_type, hook_list in hooks_config["hooks"].items():
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
                                    if os.path.isabs(cmd):
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
