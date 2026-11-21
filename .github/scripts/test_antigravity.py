#!/usr/bin/env python3
"""Check Antigravity bundle packaging, hook conversion, and settings sync."""

from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
import tempfile
import unittest
from pathlib import Path

from antigravity import (
    CONFIG_TEMPLATE,
    HOOK_ADAPTER,
    MANIFEST,
    ROOT,
    SETTINGS_TEMPLATE,
    merge_plugin_config,
    merge_settings,
    package_plugin,
    sync_antigravity,
)


class PackagingTests(unittest.TestCase):
    """Verify Antigravity bundle packaging and settings templates."""

    def test_qa_reference_links_resolve_in_bundle(self):
        """Keep linked QA guidance in a fresh native bundle."""
        import re

        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "qa"
            package_plugin(ROOT / "plugins/qa", target)
            self.assertTrue((target / "references/runner.md").is_file())
            for skill in (target / "skills").glob("*/SKILL.md"):
                for link in re.findall(r"\[[^\]]+\]\(([^)]+)\)", skill.read_text()):
                    if ":" not in link and not link.startswith("#"):
                        self.assertTrue((skill.parent / link.split("#")[0]).is_file(), link)
            self.assertEqual(
                (target / "references/runner.md").read_bytes(),
                (ROOT / "plugins/qa/references/runner.md").read_bytes(),
            )

    def test_templates_valid_and_portable(self):
        """Verify committed Antigravity config and settings templates."""
        config = json.loads(CONFIG_TEMPLATE.read_text())
        for name, entry in config["plugins"].items():
            self.assertTrue(entry["enabled"], name)
            self.assertTrue((ROOT / "plugins" / name / MANIFEST).is_file(), name)

        raw_settings = SETTINGS_TEMPLATE.read_text()
        settings = json.loads(raw_settings)
        self.assertEqual(settings["agentMode"], "auto")
        self.assertEqual(settings["toolPermission"], "proceed-in-sandbox")
        self.assertIn("allow", settings["permissions"])
        self.assertNotIn("trustedWorkspaces", settings)
        self.assertNotIn("/home/", raw_settings)
        self.assertNotIn("/Users/", raw_settings)

    def test_merge_helpers_preserve_local_state(self):
        """Keep existing local plugins, trustedWorkspaces, and custom rules on merge."""
        merged_plugins = merge_plugin_config(
            {"plugins": {"personal-skills": {"enabled": True}, "simplify": {"enabled": False}}},
            {"plugins": {"simplify": {"enabled": True}, "google-telemetry": {"enabled": True}}},
        )
        self.assertTrue(merged_plugins["plugins"]["personal-skills"]["enabled"])
        self.assertTrue(merged_plugins["plugins"]["simplify"]["enabled"])
        self.assertTrue(merged_plugins["plugins"]["google-telemetry"]["enabled"])

        merged_settings = merge_settings(
            {
                "trustedWorkspaces": ["/tmp/work"],
                "model": "custom-model",
                "permissions": {"allow": ["command(custom)", "command(git status)"]},
            },
            {
                "agentMode": "auto",
                "permissions": {"allow": ["command(git status)", "command(rg)"]},
            },
        )
        self.assertEqual(merged_settings["trustedWorkspaces"], ["/tmp/work"])
        self.assertEqual(merged_settings["model"], "custom-model")
        self.assertEqual(merged_settings["agentMode"], "auto")
        self.assertEqual(
            merged_settings["permissions"]["allow"],
            ["command(custom)", "command(git status)", "command(rg)"],
        )

    def test_sync_antigravity_dry_run_and_settings_write(self):
        """Verify dry-run writes nothing and skip-plugins merges settings into target home."""
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            settings_path = home / ".gemini/antigravity-cli/settings.json"
            settings_path.parent.mkdir(parents=True)
            settings_path.write_text(json.dumps({"trustedWorkspaces": ["/tmp/project"]}))

            enabled, _, _ = sync_antigravity(home, dry_run=True)
            self.assertIn("google-telemetry", enabled)
            self.assertFalse((home / ".gemini/config/config.json").exists())
            self.assertEqual(json.loads(settings_path.read_text()), {"trustedWorkspaces": ["/tmp/project"]})

            sync_antigravity(home, skip_plugins=True)
            written = json.loads(settings_path.read_text())
            self.assertEqual(written["trustedWorkspaces"], ["/tmp/project"])
            self.assertEqual(written["agentMode"], "auto")


class HookTests(unittest.TestCase):
    """Verify converted hooks block the same tool calls under Antigravity as under Claude Code."""

    @classmethod
    def setUpClass(cls):
        """Package the hook plugins once into a shared bundle directory."""
        cls.base = Path(tempfile.mkdtemp())
        for name in ("github-dev", "humanize", "tavily-tools"):
            package_plugin(ROOT / "plugins" / name, cls.base / name)

    @staticmethod
    def run_hook(
        command: str, cwd: Path, tool: str, args: dict, event: str = "PreToolUse", env: dict | None = None
    ) -> dict:
        """Run a native hook command with an Antigravity tool call on stdin.

        Args:
            command (str): Native hook shell command.
            cwd (Path): Directory the hook runs in, the bundle root for converted hooks.
            tool (str): Antigravity tool name.
            args (dict): Antigravity tool arguments.
            event (str, optional): Antigravity hook event name.
            env (dict, optional): Extra environment variables for the hook process.

        Returns:
            (dict): Parsed hook answer.
        """
        payload = {"hookEventName": event, "cwd": str(cwd), "toolCall": {"name": tool, "args": args}}
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            input=json.dumps(payload),
            capture_output=True,
            text=True,
            check=True,
            env={**os.environ, **(env or {})},
        )
        return json.loads(result.stdout)

    def decisions(self, plugin: str, tool: str, args: dict, env: dict | None = None) -> list[dict]:
        """Return the answer of each converted PreToolUse hook group of a bundle that matches a tool call."""
        entries = json.loads((self.base / plugin / "hooks.json").read_text())[plugin]["PreToolUse"]
        return [
            self.run_hook(entry["hooks"][0]["command"], self.base / plugin, tool, args, env=env)
            for entry in entries
            if re.fullmatch(entry["matcher"], tool)
        ]

    def test_bundles_hold_native_hooks(self):
        """Write hooks.json at the bundle root with Antigravity tool names and runnable scripts."""
        hooks = json.loads((self.base / "humanize/hooks.json").read_text())
        self.assertEqual(
            [entry["matcher"] for entry in hooks["humanize"]["PreToolUse"]],
            ["write_file|write_to_file|edit_file|replace_file_content|multi_replace_file_content", "run_command"],
        )
        self.assertNotIn("CLAUDE_PLUGIN_ROOT", (self.base / "github-dev/hooks.json").read_text())
        self.assertEqual((self.base / "humanize/hooks/antigravity_hook.py").read_bytes(), HOOK_ADAPTER.read_bytes())
        self.assertTrue((self.base / "github-dev/hooks/scripts/commit_message.py").is_file())
        self.assertFalse((self.base / "tavily-tools/hooks.json").exists())

    def test_commit_hooks_decide_like_claude(self):
        """Deny a commit without a verification trailer, allow one with it, and skip Claude-only prompts."""
        (answer,) = self.decisions("github-dev", "run_command", {"CommandLine": 'git commit -m "fix: tidy"'})
        self.assertEqual(answer["decision"], "deny")
        self.assertIn("verification:", answer["reason"])
        for command in ('git commit -m "fix: tidy" -m "verification: none (docs)"', "gh pr create --title t --body b"):
            answers = self.decisions("github-dev", "run_command", {"CommandLine": command}, {"CLAUDECODE": "1"})
            self.assertEqual([a["decision"] for a in answers], ["allow"], command)

    def test_humanize_checks_writes_edits_and_commands(self):
        """Deny buzzwords in written files, single and multi-chunk edits, and commit messages."""
        (self.base / "notes.md").write_text("hello world\n")
        path = str(self.base / "notes.md")
        for tool, args in (
            ("write_file", {"Path": path, "Content": "We delve into it.\n"}),
            ("write_to_file", {"TargetFile": path, "CodeContent": "We delve into it.\n"}),
            ("edit_file", {"Path": path, "Target": "hello", "Replacement": "we delve into"}),
            (
                "replace_file_content",
                {"TargetFile": path, "TargetContent": "hello", "ReplacementContent": "we delve into"},
            ),
            (
                "multi_replace_file_content",
                {"TargetFile": path, "ReplacementChunks": [{"TargetContent": "world", "ReplacementContent": "delve"}]},
            ),
            ("run_command", {"CommandLine": 'git commit -m "fix: delve into it"'}),
        ):
            with self.subTest(tool=tool):
                self.assertEqual([a["decision"] for a in self.decisions("humanize", tool, args)], ["deny"])
        (answer,) = self.decisions("humanize", "write_file", {"Path": path, "Content": "Plain words.\n"})
        self.assertEqual(answer["decision"], "allow")

    def test_adapter_maps_exit_codes_and_events(self):
        """Let a deny win, turn exit 2 into a deny and other failures into an allow, and answer PostToolUse with {}."""
        for commands, event, expected in (
            (["exit 0", "echo nope >&2; exit 2"], "PreToolUse", {"decision": "deny", "reason": "nope"}),
            (["exit 1"], "PreToolUse", {"decision": "allow", "reason": ""}),
            (["exit 2"], "PostToolUse", {}),
        ):
            command = shlex.join(["python3", str(HOOK_ADAPTER), *commands])
            self.assertEqual(
                self.run_hook(command, self.base, "run_command", {"CommandLine": "ls"}, event), expected, commands
            )


if __name__ == "__main__":
    unittest.main()
