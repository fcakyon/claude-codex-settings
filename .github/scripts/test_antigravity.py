#!/usr/bin/env python3
"""Check Antigravity bundle packaging and settings sync."""

import json
import tempfile
import unittest
from pathlib import Path

from antigravity import (
    CONFIG_TEMPLATE,
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


if __name__ == "__main__":
    unittest.main()
