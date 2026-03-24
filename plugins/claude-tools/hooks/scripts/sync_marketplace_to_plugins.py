#!/usr/bin/env python3
"""Sync marketplace.json plugin entries to individual plugin.json files."""

import json
import sys
from pathlib import Path


def get_edited_file_path():
    """Extract file path from hook input."""
    try:
        input_data = json.load(sys.stdin)
        return input_data.get("tool_input", {}).get("file_path", "")
    except (json.JSONDecodeError, KeyError):
        return ""


def sync_marketplace_to_plugins():
    """Sync marketplace.json entries to individual plugin.json files."""
    edited_path = get_edited_file_path()

    # Only trigger for marketplace.json edits
    if not edited_path.endswith("marketplace.json"):
        return 0

    marketplace_path = Path(edited_path)
    if not marketplace_path.exists():
        return 0

    try:
        marketplace = json.loads(marketplace_path.read_text())
    except (json.JSONDecodeError, OSError) as e:
        print(f"❌ Failed to read marketplace.json: {e}", file=sys.stderr)
        return 2

    plugins = marketplace.get("plugins", [])
    if not plugins:
        return 0

    marketplace_dir = marketplace_path.parent.parent  # Go up from .claude-plugin/
    synced = []

    for plugin in plugins:
        source = plugin.get("source")
        if not source:
            continue

        # Resolve plugin directory relative to marketplace root
        plugin_dir = (marketplace_dir / source).resolve()
        plugin_json_dir = plugin_dir / ".claude-plugin"
        plugin_json_path = plugin_json_dir / "plugin.json"

        # Build plugin.json content from marketplace entry
        plugin_data = {"name": plugin.get("name", "")}

        # Add optional fields if present in marketplace
        for field in ["version", "description", "author", "homepage", "repository", "license"]:
            if field in plugin:
                plugin_data[field] = plugin[field]

        # Create directory if needed
        plugin_json_dir.mkdir(parents=True, exist_ok=True)

        # Check if update needed
        current_data = {}
        if plugin_json_path.exists():
            try:
                current_data = json.loads(plugin_json_path.read_text())
            except json.JSONDecodeError:
                pass

        if current_data != plugin_data:
            plugin_json_path.write_text(json.dumps(plugin_data, indent=2) + "\n")
            synced.append(plugin.get("name", source))

    if synced:
        print(f"✓ Synced {len(synced)} plugin manifest(s): {', '.join(synced)}")

    return 0


if __name__ == "__main__":
    sys.exit(sync_marketplace_to_plugins())
