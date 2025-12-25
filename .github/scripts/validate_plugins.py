#!/usr/bin/env python3
"""Validate all Claude Code plugins conform to specs."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml


def parse_frontmatter(content: str) -> tuple[dict | None, str]:
    """Parse YAML frontmatter from markdown content."""
    if not content.startswith("---"):
        return None, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content
    try:
        frontmatter = yaml.safe_load(parts[1])
        return frontmatter, parts[2].strip()
    except yaml.YAMLError:
        return None, content


def validate_plugin_json(plugin_dir: Path) -> list[str]:
    """Validate .claude-plugin/plugin.json exists and is valid."""
    errors = []
    plugin_json = plugin_dir / ".claude-plugin" / "plugin.json"

    if not plugin_json.exists():
        errors.append(f"{plugin_dir.name}: Missing .claude-plugin/plugin.json")
        return errors

    try:
        with open(plugin_json) as f:
            config = json.load(f)

        if "name" not in config:
            errors.append(f"{plugin_dir.name}: plugin.json missing 'name' field")
        elif config["name"] != plugin_dir.name:
            errors.append(f"{plugin_dir.name}: plugin.json name '{config['name']}' doesn't match directory name")
    except json.JSONDecodeError as e:
        errors.append(f"{plugin_dir.name}: Invalid plugin.json - {e}")

    return errors


def validate_skills(plugin_dir: Path) -> list[str]:
    """Validate skills conform to Claude Code specs."""
    errors = []
    skills_dir = plugin_dir / "skills"
    if not skills_dir.exists():
        return errors

    for skill_path in skills_dir.iterdir():
        if not skill_path.is_dir():
            continue

        prefix = f"{plugin_dir.name}/skills/{skill_path.name}"

        # Check directory name is kebab-case
        if not re.match(r"^[a-z0-9-]+$", skill_path.name):
            errors.append(f"{prefix}: Directory must be kebab-case")

        skill_md = skill_path / "SKILL.md"
        if not skill_md.exists():
            errors.append(f"{prefix}: Missing SKILL.md")
            continue

        content = skill_md.read_text()
        frontmatter, body = parse_frontmatter(content)

        if not frontmatter:
            errors.append(f"{prefix}/SKILL.md: Missing YAML frontmatter")
            continue

        # Validate name field
        if "name" not in frontmatter:
            errors.append(f"{prefix}/SKILL.md: Missing 'name' field")
        else:
            name = frontmatter["name"]
            if not isinstance(name, str):
                errors.append(f"{prefix}/SKILL.md: 'name' must be string")
            elif len(name) > 64:
                errors.append(f"{prefix}/SKILL.md: 'name' exceeds 64 chars ({len(name)})")
            elif not re.match(r"^[a-z0-9]+(-[a-z0-9]+)*$", name):
                errors.append(f"{prefix}/SKILL.md: 'name' must be kebab-case: '{name}'")

        # Validate description field
        if "description" not in frontmatter:
            errors.append(f"{prefix}/SKILL.md: Missing 'description' field")
        else:
            desc = frontmatter["description"]
            if not isinstance(desc, str):
                errors.append(f"{prefix}/SKILL.md: 'description' must be string")
            elif len(desc) > 300:
                errors.append(f"{prefix}/SKILL.md: 'description' exceeds 300 chars ({len(desc)})")

        # Check body exists
        if not body or len(body.strip()) < 20:
            errors.append(f"{prefix}/SKILL.md: Body content too short")

    return errors


def validate_agents(plugin_dir: Path) -> list[str]:
    """Validate agents conform to Claude Code specs."""
    errors = []
    agents_dir = plugin_dir / "agents"
    if not agents_dir.exists():
        return errors

    valid_models = {"inherit", "sonnet", "opus", "haiku"}
    valid_colors = {"blue", "cyan", "green", "yellow", "magenta", "red"}

    for agent_file in agents_dir.iterdir():
        if not agent_file.is_file() or agent_file.suffix != ".md":
            continue

        prefix = f"{plugin_dir.name}/agents/{agent_file.name}"
        name = agent_file.stem

        # Check filename is kebab-case
        if not re.match(r"^[a-z0-9-]+$", name):
            errors.append(f"{prefix}: Filename must be kebab-case")

        content = agent_file.read_text()
        frontmatter, body = parse_frontmatter(content)

        if not frontmatter:
            errors.append(f"{prefix}: Missing YAML frontmatter")
            continue

        # Validate name field
        if "name" not in frontmatter:
            errors.append(f"{prefix}: Missing 'name' field")
        else:
            agent_name = frontmatter["name"]
            if not isinstance(agent_name, str):
                errors.append(f"{prefix}: 'name' must be string")
            elif len(agent_name) < 3 or len(agent_name) > 50:
                errors.append(f"{prefix}: 'name' must be 3-50 chars ({len(agent_name)})")
            elif not re.match(r"^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$", agent_name):
                errors.append(
                    f"{prefix}: 'name' must be lowercase with hyphens, start/end alphanumeric: '{agent_name}'"
                )

        # Validate description field
        if "description" not in frontmatter:
            errors.append(f"{prefix}: Missing 'description' field")
        else:
            desc = frontmatter["description"]
            if not isinstance(desc, str):
                errors.append(f"{prefix}: 'description' must be string")
            elif len(desc) < 10 or len(desc) > 5000:
                errors.append(f"{prefix}: 'description' must be 10-5000 chars ({len(desc)})")

        # Validate model field
        if "model" not in frontmatter:
            errors.append(f"{prefix}: Missing 'model' field")
        elif frontmatter["model"] not in valid_models:
            errors.append(f"{prefix}: 'model' must be one of {valid_models}: '{frontmatter['model']}'")

        # Validate color field
        if "color" not in frontmatter:
            errors.append(f"{prefix}: Missing 'color' field")
        elif frontmatter["color"] not in valid_colors:
            errors.append(f"{prefix}: 'color' must be one of {valid_colors}: '{frontmatter['color']}'")

        # Validate tools field if present
        if "tools" in frontmatter:
            tools = frontmatter["tools"]
            if not isinstance(tools, list):
                errors.append(f"{prefix}: 'tools' must be array")

        # Check body exists
        if not body or len(body.strip()) < 20:
            errors.append(f"{prefix}: System prompt too short (<20 chars)")
        elif len(body.strip()) > 10000:
            errors.append(f"{prefix}: System prompt too long (>10000 chars)")

    return errors


def validate_commands(plugin_dir: Path) -> list[str]:
    """Validate commands conform to Claude Code specs."""
    errors = []
    commands_dir = plugin_dir / "commands"
    if not commands_dir.exists():
        return errors

    valid_models = {"sonnet", "opus", "haiku"}

    for cmd_file in commands_dir.rglob("*.md"):
        prefix = f"{plugin_dir.name}/commands/{cmd_file.relative_to(commands_dir)}"
        name = cmd_file.stem

        # Check filename is kebab-case
        if not re.match(r"^[a-z0-9-]+$", name):
            errors.append(f"{prefix}: Filename must be kebab-case")

        content = cmd_file.read_text()
        frontmatter, body = parse_frontmatter(content)

        # Frontmatter is optional for commands
        if frontmatter:
            # Validate model if present
            if "model" in frontmatter and frontmatter["model"] not in valid_models:
                errors.append(f"{prefix}: 'model' must be one of {valid_models}: '{frontmatter['model']}'")

            # Validate disable-model-invocation if present
            if "disable-model-invocation" in frontmatter:
                if not isinstance(frontmatter["disable-model-invocation"], bool):
                    errors.append(f"{prefix}: 'disable-model-invocation' must be boolean")

        # Check body exists
        if not body and not (frontmatter and body == ""):
            # If no frontmatter, content is the body
            if not content.strip():
                errors.append(f"{prefix}: Command body is empty")

    return errors


def validate_hooks(plugin_dir: Path) -> list[str]:
    """Validate hooks conform to Claude Code specs."""
    errors = []
    hooks_dir = plugin_dir / "hooks"
    if not hooks_dir.exists():
        return errors

    hooks_json = hooks_dir / "hooks.json"
    if not hooks_json.exists():
        errors.append(f"{plugin_dir.name}/hooks: Missing hooks.json")
        return errors

    try:
        with open(hooks_json) as f:
            config = json.load(f)
    except json.JSONDecodeError as e:
        errors.append(f"{plugin_dir.name}/hooks/hooks.json: Invalid JSON - {e}")
        return errors

    # Check for wrapper format
    if "hooks" not in config:
        errors.append(f"{plugin_dir.name}/hooks/hooks.json: Must use wrapper format with 'hooks' field")
        return errors

    valid_events = {
        "PreToolUse",
        "PostToolUse",
        "Stop",
        "SubagentStop",
        "SessionStart",
        "SessionEnd",
        "UserPromptSubmit",
        "PreCompact",
        "Notification",
    }

    hooks_config = config["hooks"]
    for event, hook_list in hooks_config.items():
        if event not in valid_events:
            errors.append(f"{plugin_dir.name}/hooks/hooks.json: Invalid event '{event}'. Must be one of {valid_events}")
            continue

        if not isinstance(hook_list, list):
            errors.append(f"{plugin_dir.name}/hooks/hooks.json: '{event}' must be array")
            continue

        for i, hook_entry in enumerate(hook_list):
            if not isinstance(hook_entry, dict):
                continue

            hooks = hook_entry.get("hooks", [])
            for j, hook in enumerate(hooks):
                if not isinstance(hook, dict):
                    continue

                hook_type = hook.get("type")
                if hook_type == "command":
                    cmd = hook.get("command", "")
                    # Check for ${CLAUDE_PLUGIN_ROOT} usage
                    if cmd and not cmd.startswith("${CLAUDE_PLUGIN_ROOT}"):
                        if "/" in cmd and not cmd.startswith("$"):
                            errors.append(
                                f"{plugin_dir.name}/hooks/hooks.json: "
                                f"{event}[{i}].hooks[{j}] should use ${{CLAUDE_PLUGIN_ROOT}}"
                            )

                    # Check script exists
                    if cmd and "${CLAUDE_PLUGIN_ROOT}" in cmd:
                        script_path = cmd.replace("${CLAUDE_PLUGIN_ROOT}", str(plugin_dir))
                        if not Path(script_path).exists():
                            errors.append(f"{plugin_dir.name}/hooks/hooks.json: Script not found: {cmd}")

                elif hook_type == "prompt":
                    if "prompt" not in hook:
                        errors.append(
                            f"{plugin_dir.name}/hooks/hooks.json: {event}[{i}].hooks[{j}] missing 'prompt' field"
                        )

    # Validate script naming in hooks/scripts/
    scripts_dir = hooks_dir / "scripts"
    if scripts_dir.exists():
        for script in scripts_dir.iterdir():
            if script.is_file() and script.suffix in {".py", ".sh"}:
                name = script.stem
                if not re.match(r"^[a-z0-9_]+$", name):
                    errors.append(f"{plugin_dir.name}/hooks/scripts/{script.name}: Script name must use snake_case")

    return errors


def validate_mcp(plugin_dir: Path) -> list[str]:
    """Validate MCP configuration if present."""
    errors = []
    mcp_json = plugin_dir / ".mcp.json"
    if not mcp_json.exists():
        return errors

    try:
        with open(mcp_json) as f:
            json.load(f)
    except json.JSONDecodeError as e:
        errors.append(f"{plugin_dir.name}/.mcp.json: Invalid JSON - {e}")

    return errors


def main():
    """Validate all plugins and return exit code."""
    plugins_dir = Path("plugins")
    if not plugins_dir.exists():
        print("No plugins directory found")
        return 0

    all_errors = []

    for plugin_dir in sorted(plugins_dir.iterdir()):
        if not plugin_dir.is_dir():
            continue
        if plugin_dir.name.startswith("."):
            continue

        all_errors.extend(validate_plugin_json(plugin_dir))
        all_errors.extend(validate_skills(plugin_dir))
        all_errors.extend(validate_agents(plugin_dir))
        all_errors.extend(validate_commands(plugin_dir))
        all_errors.extend(validate_hooks(plugin_dir))
        all_errors.extend(validate_mcp(plugin_dir))

    if all_errors:
        print("Plugin Validation Failed:")
        for error in all_errors:
            print(f"  - {error}")
        return 1

    print("All plugins validated successfully")
    return 0


if __name__ == "__main__":
    sys.exit(main())
