#!/bin/bash
# Propagate each plugin's version from .claude-plugin/plugin.json (source of truth)
# to all other manifests and marketplace entries.
# Usage: bash .github/scripts/sync-versions.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

python3 - "$REPO_ROOT" << 'PYEOF'
import json
import sys
from pathlib import Path

repo = Path(sys.argv[1])
changes = []

# Collect plugin versions from .claude-plugin/plugin.json (source of truth)
plugin_versions = {}
for plugin_dir in sorted((repo / "plugins").iterdir()):
    claude_manifest = plugin_dir / ".claude-plugin" / "plugin.json"
    if not claude_manifest.exists():
        continue
    data = json.loads(claude_manifest.read_text())
    version = data.get("version", "")
    if version:
        plugin_versions[data["name"]] = version

    # Sync to other manifest files
    for label, path in [
        ("codex", plugin_dir / ".codex-plugin" / "plugin.json"),
        ("cursor", plugin_dir / ".cursor-plugin" / "plugin.json"),
        ("gemini", plugin_dir / "gemini-extension.json"),
    ]:
        if not path.exists():
            continue
        manifest = json.loads(path.read_text())
        if manifest.get("version") != version:
            manifest["version"] = version
            path.write_text(json.dumps(manifest, indent=2) + "\n")
            changes.append(f"  {plugin_dir.name}/{label}: -> {version}")

# Update marketplace files that have per-plugin version fields
for label, mkt_path in [
    ("claude", repo / ".claude-plugin" / "marketplace.json"),
    ("cursor", repo / ".cursor-plugin" / "marketplace.json"),
]:
    if not mkt_path.exists():
        continue
    mkt = json.loads(mkt_path.read_text())
    for entry in mkt.get("plugins", []):
        name = entry.get("name", "")
        if name in plugin_versions and entry.get("version") != plugin_versions[name]:
            entry["version"] = plugin_versions[name]
            changes.append(f"  {label} marketplace/{name}: -> {plugin_versions[name]}")
    mkt_path.write_text(json.dumps(mkt, indent=2) + "\n")

if changes:
    print("Version sync changes:")
    for c in changes:
        print(c)
else:
    print("All versions already in sync.")
PYEOF
