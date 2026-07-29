#!/usr/bin/env python3
"""Behavioral tests for the cross-tool simplify commit guard."""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
GUARD = REPO_ROOT / "plugins" / "simplify" / "hooks" / "scripts" / "guard.py"
COMPLETION_SIGNAL = "echo simplify-guard:complete"


class SimplifyGuardTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp_dir.name)
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        self.marker = self.repo / ".git" / "simplify-guard.ok"

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def run_guard(
        self,
        event: str,
        command: str = "",
        *,
        codex: bool = False,
        claude: bool = False,
        skill: str | None = None,
    ) -> dict | None:
        payload = {
            "hook_event_name": event,
            "cwd": str(self.repo),
            "tool_input": {"command": command},
        }
        if codex:
            payload["turn_id"] = "turn-test"
        if skill:
            payload["tool_input"]["skill"] = skill

        env = os.environ.copy()
        if claude:
            env["CLAUDECODE"] = "1"
        else:
            env.pop("CLAUDECODE", None)

        result = subprocess.run(
            ["python3", str(GUARD)],
            input=json.dumps(payload),
            capture_output=True,
            check=True,
            text=True,
            env=env,
        )
        return json.loads(result.stdout) if result.stdout else None

    def assert_denied(self, output: dict | None) -> None:
        self.assertEqual(
            output["hookSpecificOutput"]["permissionDecision"],
            "deny",
        )

    def test_codex_commit_is_denied_before_simplify(self) -> None:
        self.assert_denied(
            self.run_guard("PreToolUse", "git commit -m test", codex=True)
        )

    def test_codex_completion_allows_exactly_one_commit_attempt(self) -> None:
        self.assertIsNone(self.run_guard("PreToolUse", COMPLETION_SIGNAL, codex=True))
        self.assertTrue(self.marker.exists())

        self.assertIsNone(
            self.run_guard("PreToolUse", "git commit -m test", codex=True)
        )
        self.assertFalse(self.marker.exists())
        self.assert_denied(
            self.run_guard("PreToolUse", "git commit -m again", codex=True)
        )

    def test_claude_skill_event_still_allows_one_commit_attempt(self) -> None:
        self.assertIsNone(self.run_guard("PostToolUse", skill="simplify", claude=True))
        self.assertTrue(self.marker.exists())
        self.assertIsNone(
            self.run_guard("PreToolUse", "git commit -m test", claude=True)
        )
        self.assertFalse(self.marker.exists())

    def test_only_runtime_specific_completion_events_mint(self) -> None:
        cases = [
            {"event": "PostToolUse", "skill": "simplify", "codex": True},
            {"event": "PreToolUse", "command": COMPLETION_SIGNAL, "claude": True},
            {"event": "PreToolUse", "command": COMPLETION_SIGNAL},
            {
                "event": "PreToolUse",
                "command": "echo simplify-guard:complete-later",
                "codex": True,
            },
        ]
        for case in cases:
            with self.subTest(case):
                self.assertIsNone(self.run_guard(**case))
                self.assertFalse(self.marker.exists())

    def test_other_runtimes_are_not_blocked_or_minted(self) -> None:
        self.assertIsNone(self.run_guard("PreToolUse", "git commit -m test"))

    def test_quoted_commit_text_and_commit_helpers_are_ignored(self) -> None:
        self.assertIsNone(
            self.run_guard("PreToolUse", 'echo "git commit -m test"', codex=True)
        )
        self.assertIsNone(
            self.run_guard("PreToolUse", "git commit-tree HEAD^{tree}", codex=True)
        )


if __name__ == "__main__":
    unittest.main()
