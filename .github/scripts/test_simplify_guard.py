#!/usr/bin/env python3
"""Behavioral tests for the cross-tool simplify commit guard."""

from __future__ import annotations

import json
import os
import shlex
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
GUARD = REPO_ROOT / "plugins" / "simplify" / "hooks" / "scripts" / "guard.py"
BYPASS_SIGNAL = "echo simplify-guard:bypass"


class SimplifyGuardTest(unittest.TestCase):
    """Test the cross-tool commit guard."""

    def setUp(self) -> None:
        """Create an isolated Git worktree and non-repository session directory."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.session_dir = Path(self.temp_dir.name)
        self.repo = self.session_dir / "repo"
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        self.marker = self.repo / ".git" / "simplify-guard.ok"

    def tearDown(self) -> None:
        """Remove the temporary worktree."""
        self.temp_dir.cleanup()

    def run_guard(
        self,
        event: str,
        command: str = "",
        *,
        codex: bool = False,
        claude: bool = False,
        cwd: Path | None = None,
        skill: str | None = None,
    ) -> dict | None:
        """Run the guard with one hook payload.

        Args:
            event (str): Hook event name.
            command (str, optional): Shell command supplied to the hook.
            codex (bool, optional): Whether to send a Codex payload.
            claude (bool, optional): Whether to set the Claude Code environment.
            cwd (Path | None, optional): Session working directory.
            skill (str | None, optional): Claude Code skill name.

        Returns:
            (dict | None): Hook response when the command is denied.
        """
        payload = {
            "hook_event_name": event,
            "cwd": str(cwd or self.repo),
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

    def completion_signal(self, repo: Path | None = None) -> str:
        """Build a completion signal for a reviewed worktree.

        Args:
            repo (Path | None, optional): Reviewed worktree path.

        Returns:
            (str): Shell-safe completion command.
        """
        return shlex.join(["echo", "simplify-guard:complete", str(repo or self.repo)])

    def assert_denied(self, output: dict | None) -> None:
        """Assert that a hook response denies the command.

        Args:
            output (dict | None): Hook response to inspect.
        """
        self.assertEqual(
            output["hookSpecificOutput"]["permissionDecision"],
            "deny",
        )

    def test_claude_and_codex_commits_are_denied_before_simplify(self) -> None:
        """Deny supported commit forms before simplify runs."""
        for runtime in ("codex", "claude"):
            for command in (
                "git commit -m test",
                f"git -C {self.repo} commit -m test",
                "git -c user.name=test commit -m test",
                "git --no-pager commit -m test",
            ):
                with self.subTest(runtime=runtime, command=command):
                    self.assert_denied(self.run_guard("PreToolUse", command, **{runtime: True}))

    def test_git_c_uses_the_target_worktree_marker(self) -> None:
        """Keep completion bound to its reviewed worktree."""
        other_repo = self.repo / "other repo"
        subprocess.run(["git", "init", "-q", str(other_repo)], check=True)
        self.assertIsNone(self.run_guard("PreToolUse", self.completion_signal(), codex=True))
        self.assert_denied(
            self.run_guard(
                "PreToolUse",
                f"git -C '{other_repo}' commit -m test",
                codex=True,
            )
        )
        self.assertTrue(self.marker.exists())

    def test_completion_allows_exactly_one_commit_attempt(self) -> None:
        """Allow one commit attempt after completion."""
        for runtime in ("codex", "claude"):
            with self.subTest(runtime=runtime):
                self.assertIsNone(self.run_guard("PreToolUse", self.completion_signal(), **{runtime: True}))
                self.assertTrue(self.marker.exists())
                self.assertIsNone(self.run_guard("PreToolUse", "git commit -m test", **{runtime: True}))
                self.assertFalse(self.marker.exists())
                self.assert_denied(self.run_guard("PreToolUse", "git commit -m again", **{runtime: True}))

    def test_explicit_user_bypass_allows_exactly_one_commit_attempt(self) -> None:
        """Allow one commit attempt after an explicit bypass."""
        for runtime in ("codex", "claude"):
            with self.subTest(runtime=runtime):
                self.assertIsNone(self.run_guard("PreToolUse", BYPASS_SIGNAL, **{runtime: True}))
                self.assertTrue(self.marker.exists())
                self.assertIsNone(self.run_guard("PreToolUse", "git commit -m test", **{runtime: True}))
                self.assertFalse(self.marker.exists())
                self.assert_denied(self.run_guard("PreToolUse", "git commit -m again", **{runtime: True}))

    def test_completion_targets_a_repo_outside_the_session_cwd(self) -> None:
        """Bind completion when the session directory is not a repository."""
        for runtime in ("codex", "claude"):
            with self.subTest(runtime=runtime):
                self.assertIsNone(
                    self.run_guard(
                        "PreToolUse",
                        self.completion_signal(),
                        cwd=self.session_dir,
                        **{runtime: True},
                    )
                )
                self.assertIsNone(
                    self.run_guard(
                        "PreToolUse",
                        f"git -C {self.repo} commit -m test",
                        cwd=self.session_dir,
                        **{runtime: True},
                    )
                )
                self.assert_denied(
                    self.run_guard(
                        "PreToolUse",
                        f"git -C {self.repo} commit -m again",
                        cwd=self.session_dir,
                        **{runtime: True},
                    )
                )

    def test_only_supported_completion_events_mint(self) -> None:
        """Ignore incomplete or unsupported completion events."""
        cases = [
            {"event": "PostToolUse", "skill": "simplify", "claude": True},
            {"event": "PreToolUse", "command": "echo simplify-guard:complete", "codex": True},
            {"event": "PreToolUse", "command": self.completion_signal()},
            {"event": "PreToolUse", "command": BYPASS_SIGNAL},
            {
                "event": "PreToolUse",
                "command": "echo simplify-guard:complete-later",
                "codex": True,
            },
            {
                "event": "PreToolUse",
                "command": "echo simplify-guard:bypass-later",
                "codex": True,
            },
        ]
        for case in cases:
            with self.subTest(case):
                self.assertIsNone(self.run_guard(**case))
                self.assertFalse(self.marker.exists())

    def test_other_runtimes_are_not_blocked_or_minted(self) -> None:
        """Leave runtimes without a completion path unchanged."""
        self.assertIsNone(self.run_guard("PreToolUse", "git commit -m test"))

    def test_quoted_commit_text_and_commit_helpers_are_ignored(self) -> None:
        """Ignore quoted text and non-commit Git commands."""
        self.assertIsNone(self.run_guard("PreToolUse", 'echo "git commit -m test"', codex=True))
        self.assertIsNone(self.run_guard("PreToolUse", "git commit-tree HEAD^{tree}", codex=True))
        self.assertIsNone(self.run_guard("PreToolUse", "git log commit", codex=True))
        self.assertIsNone(self.run_guard("PreToolUse", "git rev-parse commit", codex=True))
        self.assertIsNone(self.run_guard("PreToolUse", "git --version commit", codex=True))
        self.assertFalse((self.repo / "alias-ran").exists())
        self.assertIsNone(
            self.run_guard(
                "PreToolUse",
                f"git -c alias.foo='!touch {self.repo / 'alias-ran'}' foo commit",
                codex=True,
            )
        )
        self.assertFalse((self.repo / "alias-ran").exists())


if __name__ == "__main__":
    unittest.main()
