#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["pyyaml"]
# ///
"""Package and install this marketplace's skills and MCP servers for Antigravity."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = Path(".antigravity-plugin/plugin.json")
SCHEMA = "https://antigravity.google/schemas/v1/plugin.json"


def manifest_for(plugin: Path) -> dict | None:
    """Build native metadata for plugins with portable components.

    Args:
        plugin (Path): Source plugin directory.

    Returns:
        (dict | None): Native metadata, or None when no skills or MCP servers exist.
    """
    if not any(plugin.glob("skills/*/SKILL.md")) and not (plugin / ".mcp.json").exists():
        return None
    source = json.loads((plugin / ".claude-plugin/plugin.json").read_text())
    return {"$schema": SCHEMA} | {
        key: source[key]
        for key in ("name", "version", "description", "author", "homepage", "repository", "license")
        if key in source
    }


def parse_frontmatter(content: str) -> tuple[dict | None, str]:
    """Parse YAML frontmatter from Markdown content."""
    import yaml

    if not content.startswith("---"):
        return None, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content
    try:
        return yaml.safe_load(parts[1]), parts[2].strip()
    except yaml.YAMLError:
        return None, content


def package_plugin(plugin: Path, target: Path) -> None:
    """Copy skills and MCP servers into a native Antigravity plugin.

    Args:
        plugin (Path): Source plugin directory.
        target (Path): Empty destination directory.
    """
    target.mkdir()
    shutil.copyfile(plugin / MANIFEST, target / "plugin.json")
    for name in ("skills", "scripts", "assets", "package.json", "package-lock.json", "tsconfig.json", "LICENSE"):
        source = plugin / name
        if source.is_dir():
            shutil.copytree(source, target / name, ignore=shutil.ignore_patterns("*.zip", "__pycache__"))
        elif source.is_file():
            shutil.copyfile(source, target / name)
    for skill in sorted((target / "skills").glob("*/SKILL.md")):
        content = skill.read_text()
        metadata, body = parse_frontmatter(content)
        destination = skill.parent.with_name(metadata["name"])
        if destination != skill.parent:
            skill.parent.rename(destination)
            skill = destination / "SKILL.md"
        if len(body.encode()) > 24000:
            skill.with_name("INSTRUCTIONS.md").write_text(content)
            skill.write_text(
                "---" + content.split("---", 2)[1] + "---\n\n"
                "Read [INSTRUCTIONS.md](INSTRUCTIONS.md) in this skill directory in full before starting. "
                "Continue reading if a tool truncates it. Resolve its relative paths from this directory.\n"
            )
    if (plugin / ".mcp.json").exists():
        servers = json.loads((plugin / ".mcp.json").read_text())
        (target / "mcp_config.json").write_text(json.dumps({"mcpServers": servers}, indent=2) + "\n")


def main() -> None:
    """Install selected plugins or validate all native bundles."""
    available = sorted(path.name for path in (ROOT / "plugins").iterdir() if (path / MANIFEST).exists())
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="action", required=True)
    commands.add_parser("install").add_argument("plugins", nargs="+", choices=available)
    commands.add_parser("validate").set_defaults(plugins=available)
    args = parser.parse_args()
    for name in args.plugins:
        with tempfile.TemporaryDirectory(prefix="antigravity-") as directory:
            target = Path(directory) / name
            package_plugin(ROOT / "plugins" / name, target)
            if args.action == "install":
                subprocess.run(["agy", "plugin", "install", str(target)], check=True)
            else:
                subprocess.run(["agy", "plugin", "validate", str(target), "--strict"], check=True)


if __name__ == "__main__":
    main()
