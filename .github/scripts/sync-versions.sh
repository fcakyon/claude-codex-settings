#!/bin/bash
# Propagate each plugin's version and license from .claude-plugin/plugin.json
# (source of truth) to all sibling manifests and marketplace entries.
# Marketplace files are edited via narrow regex replacements so existing
# hand-tuned JSON formatting (compact arrays, key order) is preserved.
# Usage: bash .github/scripts/sync-versions.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

python3 - "$REPO_ROOT" << 'PYEOF'
import json
import re
import sys
from pathlib import Path

repo = Path(sys.argv[1])
changes = []
warnings = []

# Source of truth: .claude-plugin/plugin.json for each plugin under plugins/
plugin_meta = {}
for plugin_dir in sorted((repo / "plugins").iterdir()):
    claude_manifest = plugin_dir / ".claude-plugin" / "plugin.json"
    if not claude_manifest.exists():
        continue
    data = json.loads(claude_manifest.read_text())
    name = data.get("name") or plugin_dir.name
    plugin_meta[name] = {
        "version": data.get("version", ""),
        "license": data.get("license"),
        "dir": plugin_dir,
    }
    if not data.get("license"):
        warnings.append(f"  {plugin_dir.name}: missing 'license' in .claude-plugin/plugin.json")

# Sibling plugin.json files. Gemini's manifest spec excludes 'license'.
for name, meta in plugin_meta.items():
    plugin_dir = meta["dir"]
    for label, path, syncs_license in [
        ("codex",  plugin_dir / ".codex-plugin"  / "plugin.json", True),
        ("cursor", plugin_dir / ".cursor-plugin" / "plugin.json", True),
        ("gemini", plugin_dir / "gemini-extension.json",          False),
    ]:
        if not path.exists():
            continue
        manifest = json.loads(path.read_text())
        before = dict(manifest)
        if meta["version"] and manifest.get("version") != meta["version"]:
            manifest["version"] = meta["version"]
        if syncs_license and meta["license"] and manifest.get("license") != meta["license"]:
            manifest["license"] = meta["license"]
        if manifest != before:
            path.write_text(json.dumps(manifest, indent=2) + "\n")
            diff = []
            if before.get("version") != manifest.get("version"):
                diff.append(f"version={manifest['version']}")
            if before.get("license") != manifest.get("license"):
                diff.append(f"license={manifest['license']}")
            changes.append(f"  {plugin_dir.name}/{label}: " + ", ".join(diff))


def find_entry_span(text, name):
    """Return (start, end) byte offsets of the JSON object containing `"name": "<name>"`, or None."""
    m = re.search(r'"name"\s*:\s*"' + re.escape(name) + r'"', text)
    if not m:
        return None
    start = text.rfind("{", 0, m.start())
    if start < 0:
        return None
    depth = 0
    for i in range(start, len(text)):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1
    return None


def narrow_update(text, name, field, value):
    """Within the entry block for `name`, replace the value of `field`, or insert it after the `version` line."""
    span = find_entry_span(text, name)
    if span is None:
        return text, False
    s, e = span
    block = text[s:e]
    field_pat = re.compile(r'("' + re.escape(field) + r'"\s*:\s*)"[^"]*"')
    if field_pat.search(block):
        new_block = field_pat.sub(lambda m: m.group(1) + json.dumps(value), block, count=1)
    else:
        ver_pat = re.compile(r'(\n([ \t]+)"version"\s*:\s*"[^"]*")(,?)')
        vm = ver_pat.search(block)
        if not vm:
            return text, False
        indent = vm.group(2)
        existing_comma = vm.group(3)
        new_version_line = vm.group(1) + ","
        new_field_line = f'\n{indent}"{field}": {json.dumps(value)}' + existing_comma
        new_block = block[:vm.start()] + new_version_line + new_field_line + block[vm.end():]
    if new_block == block:
        return text, False
    return text[:s] + new_block + text[e:], True


for label, mkt_path in [
    ("claude", repo / ".claude-plugin" / "marketplace.json"),
    ("cursor", repo / ".cursor-plugin" / "marketplace.json"),
]:
    if not mkt_path.exists():
        continue
    text = mkt_path.read_text()
    original = text
    mkt = json.loads(text)
    for entry in mkt.get("plugins", []):
        name = entry.get("name", "")
        meta = plugin_meta.get(name)
        if not meta:
            continue
        if meta["version"] and entry.get("version") != meta["version"]:
            text, ok = narrow_update(text, name, "version", meta["version"])
            if ok:
                changes.append(f"  {label} marketplace/{name}: version={meta['version']}")
        if meta["license"] and entry.get("license") != meta["license"]:
            text, ok = narrow_update(text, name, "license", meta["license"])
            if ok:
                changes.append(f"  {label} marketplace/{name}: license={meta['license']}")
    if text != original:
        # Sanity: re-parse to make sure narrow edits left valid JSON
        json.loads(text)
        mkt_path.write_text(text)

if changes:
    print("Sync changes:")
    for c in changes:
        print(c)
else:
    print("All manifests already in sync.")
if warnings:
    print("\nMissing fields in source-of-truth:")
    for w in warnings:
        print(w)
PYEOF
