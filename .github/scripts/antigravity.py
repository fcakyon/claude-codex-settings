#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["pyyaml"]
# ///
"""Package, validate, install, and sync this marketplace's Antigravity bundles and settings."""

from __future__ import annotations

import argparse
import json
import os
import re
import shlex
import shutil
import subprocess
import tempfile
from pathlib import Path

from antigravity_hook import TOOLS as HOOK_TOOLS

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = Path(".antigravity-plugin/plugin.json")
SCHEMA = "https://antigravity.google/schemas/v1/plugin.json"
CONFIG_TEMPLATE = ROOT / ".gemini/config/config.json"
SETTINGS_TEMPLATE = ROOT / ".gemini/antigravity-cli/settings.json"
LOCAL_SETTINGS_KEYS = ("trustedWorkspaces", "model", "modelProvider", "gcp", "customModelsConfig")
HOOK_ADAPTER = ROOT / ".github/scripts/antigravity_hook.py"
COPY_IGNORE = shutil.ignore_patterns("*.zip", "__pycache__", "node_modules")


def agy_env(home: Path | None = None) -> dict[str, str]:
    """Return environment variables with ACP overrides cleared and optional HOME override."""
    env = {k: v for k, v in os.environ.items() if k not in ("GEMINI_HOME", "AGY_ACP_FORCE_FILE_STORAGE")}
    if home is not None:
        env["HOME"] = str(home)
    return env


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


def convert_hooks(plugin: Path) -> dict:
    """Convert Claude Code shell and file hooks to one Antigravity hook group that runs them via the adapter.

    Args:
        plugin (Path): Source plugin directory.

    Returns:
        (dict): Native hooks.json contents, empty when no hook targets a converted tool.
    """
    events, source = {}, _read_json(plugin / "hooks/hooks.json").get("hooks", {})
    for event in ("PreToolUse", "PostToolUse"):
        for entry in source.get(event, []):
            # Claude Code treats a missing, empty or "*" matcher as every tool
            pattern = entry.get("matcher") or "*"
            matcher = "|".join(native for native, tool in HOOK_TOOLS.items() if pattern == "*" or re.fullmatch(pattern, tool))
            hooks = [hook for hook in entry["hooks"] if hook["type"] == "command"]
            if matcher and hooks:
                commands = (shlex.quote(hook["command"].replace("${CLAUDE_PLUGIN_ROOT}", ".")) for hook in hooks)
                adapter = {
                    "type": "command",
                    "command": "python3 ./hooks/antigravity_hook.py " + " ".join(commands),
                    "timeout": sum(hook.get("timeout", 60) for hook in hooks),
                }
                events.setdefault(event, []).append({"matcher": matcher, "hooks": [adapter]})
    return {plugin.name: events} if events else {}


def package_plugin(plugin: Path, target: Path) -> None:
    """Copy skills, MCP servers and converted hooks into a native Antigravity plugin.

    Args:
        plugin (Path): Source plugin directory.
        target (Path): Empty destination directory.
    """
    target.mkdir()
    shutil.copyfile(plugin / MANIFEST, target / "plugin.json")
    for name in ("skills", "scripts", "assets", "references", "package.json", "package-lock.json", "tsconfig.json", "LICENSE"):
        source = plugin / name
        if source.is_dir():
            shutil.copytree(source, target / name, ignore=COPY_IGNORE)
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
        shutil.copyfile(plugin / ".mcp.json", target / "mcp_config.json")
    if hooks := convert_hooks(plugin):
        shutil.copytree(plugin / "hooks/scripts", target / "hooks/scripts", ignore=COPY_IGNORE)
        shutil.copy2(HOOK_ADAPTER, target / "hooks/antigravity_hook.py")
        _write_json(target / "hooks.json", hooks)


def _read_json(path: Path) -> dict:
    """Read a JSON object file, returning an empty dict when missing."""
    return json.loads(path.read_text()) if path.exists() else {}


def _write_json(path: Path, data: dict) -> None:
    """Write a JSON object with 2-space indentation and a trailing newline."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n")


def _dedup_merge(existing: list, extra: list) -> list:
    """Merge two lists while keeping order and removing duplicates."""
    return list(dict.fromkeys([*existing, *extra]))


def merge_plugin_config(existing: dict, template: dict) -> dict:
    """Merge enabled plugin entries from template while preserving extra local plugins.

    Args:
        existing (dict): Existing ~/.gemini/config/config.json contents.
        template (dict): Repository config.json template.

    Returns:
        (dict): Combined plugin configuration.
    """
    return {**existing, "plugins": {**existing.get("plugins", {}), **template.get("plugins", {})}}


def merge_settings(existing: dict, template: dict) -> dict:
    """Merge Antigravity CLI defaults while preserving local machine keys and custom rules.

    Args:
        existing (dict): Existing ~/.gemini/antigravity-cli/settings.json contents.
        template (dict): Repository settings.json template.

    Returns:
        (dict): Combined CLI settings.
    """
    merged = {**existing}
    for key, value in template.items():
        if key in LOCAL_SETTINGS_KEYS and key in existing:
            continue
        if key == "permissions" and isinstance(value, dict) and isinstance(existing.get("permissions"), dict):
            perms = {**existing["permissions"]}
            for list_key in ("allow", "ask", "deny"):
                if list_key in value or list_key in perms:
                    perms[list_key] = _dedup_merge(perms.get(list_key, []), value.get(list_key, []))
            merged["permissions"] = perms
        else:
            merged[key] = value
    return merged


def _run_agy_batch(names: list[str], action: str, *extra_args: str, env: dict[str, str]) -> None:
    """Package each plugin into a shared temporary directory and run an agy plugin command."""
    with tempfile.TemporaryDirectory(prefix="antigravity-") as directory:
        base = Path(directory)
        for name in dict.fromkeys(names):
            target = base / name
            package_plugin(ROOT / "plugins" / name, target)
            subprocess.run(["agy", "plugin", action, str(target), *extra_args], env=env, check=True)


def sync_antigravity(
    home: Path,
    dry_run: bool = False,
    skip_plugins: bool = False,
    skip_settings: bool = False,
) -> tuple[list[str], dict, dict]:
    """Sync Antigravity plugins and CLI settings from repo templates into home/.gemini.

    Args:
        home (Path): User home directory holding .gemini.
        dry_run (bool): Return planned changes without installing or writing files.
        skip_plugins (bool): Skip plugin installation and ~/.gemini/config/config.json merge.
        skip_settings (bool): Skip ~/.gemini/antigravity-cli/settings.json merge.

    Returns:
        (tuple): Enabled plugin names, merged config dict, and merged settings dict.
    """
    config_path = home / ".gemini/config/config.json"
    settings_path = home / ".gemini/antigravity-cli/settings.json"
    enabled: list[str] = []
    merged_config: dict = {}
    merged_settings: dict = {}

    if not skip_plugins:
        config_template = json.loads(CONFIG_TEMPLATE.read_text())
        enabled = [name for name, entry in config_template.get("plugins", {}).items() if entry.get("enabled")]
        if not dry_run:
            _run_agy_batch(enabled, "install", env=agy_env(home))
        merged_config = merge_plugin_config(_read_json(config_path), config_template)
        if dry_run:
            print(f"Would install {len(enabled)} plugins and update {config_path}")
        else:
            _write_json(config_path, merged_config)

    if not skip_settings:
        merged_settings = merge_settings(_read_json(settings_path), json.loads(SETTINGS_TEMPLATE.read_text()))
        if dry_run:
            print(f"Would update {settings_path}")
        else:
            _write_json(settings_path, merged_settings)

    return enabled, merged_config, merged_settings


def main() -> None:
    """Install selected plugins, validate all native bundles, or sync config and plugins."""
    available = sorted(path.name for path in (ROOT / "plugins").iterdir() if (path / MANIFEST).exists())
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="action", required=True)
    commands.add_parser("install").add_argument("plugins", nargs="+", choices=available)
    commands.add_parser("validate").set_defaults(plugins=available)
    sync_parser = commands.add_parser("sync")
    sync_parser.add_argument("--dry-run", action="store_true")
    sync_parser.add_argument("--skip-plugins", action="store_true")
    sync_parser.add_argument("--skip-settings", action="store_true")
    sync_parser.add_argument("--home", type=Path, default=Path.home())
    args = parser.parse_args()
    if args.action == "sync":
        sync_antigravity(args.home, dry_run=args.dry_run, skip_plugins=args.skip_plugins, skip_settings=args.skip_settings)
        return
    extra = () if args.action == "install" else ("--strict",)
    _run_agy_batch(args.plugins, args.action, *extra, env=agy_env())


if __name__ == "__main__":
    main()
