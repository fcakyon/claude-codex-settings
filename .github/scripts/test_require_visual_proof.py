#!/usr/bin/env python3
"""Behavioral tests for the GitHub visual-proof hook."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
HOOK = REPO_ROOT / "plugins" / "github-dev" / "hooks" / "scripts" / "require_visual_proof.py"


class RequireVisualProofTest(unittest.TestCase):
    """Test visual-proof behavior."""

    def setUp(self) -> None:
        """Create a repository whose integration branch contains a design change."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp_dir.name)
        subprocess.run(["git", "init", "-q", "-b", "main", str(self.repo)], check=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=self.repo, check=True)
        subprocess.run(["git", "config", "user.name", "Test"], cwd=self.repo, check=True)
        (self.repo / "README.md").write_text("base\n")
        subprocess.run(["git", "add", "README.md"], cwd=self.repo, check=True)
        subprocess.run(["git", "commit", "-qm", "base"], cwd=self.repo, check=True)
        subprocess.run(["git", "update-ref", "refs/remotes/origin/main", "HEAD"], cwd=self.repo, check=True)
        subprocess.run(
            ["git", "symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/main"],
            cwd=self.repo,
            check=True,
        )
        subprocess.run(["git", "switch", "-qc", "development"], cwd=self.repo, check=True)
        (self.repo / "site.css").write_text("body {}\n")
        subprocess.run(["git", "add", "site.css"], cwd=self.repo, check=True)
        subprocess.run(["git", "commit", "-qm", "design"], cwd=self.repo, check=True)
        subprocess.run(
            ["git", "update-ref", "refs/remotes/origin/development", "HEAD"],
            cwd=self.repo,
            check=True,
        )

    def tearDown(self) -> None:
        """Remove the temporary repository."""
        self.temp_dir.cleanup()

    def run_hook(self, command: str | list[str]) -> dict | None:
        """Run the hook with a shell command.

        Args:
            command (str | list[str]): Command supplied to the hook.

        Returns:
            (dict | None): Hook response when the command is denied.
        """
        payload = {"cwd": str(self.repo), "tool_input": {"command": command}}
        result = subprocess.run(
            ["python3", str(HOOK)],
            input=json.dumps(payload),
            capture_output=True,
            check=True,
            text=True,
        )
        return json.loads(result.stdout) if result.stdout else None

    def test_explicit_base_excludes_changes_already_on_that_branch(self) -> None:
        """Use the PR base instead of the repository default."""
        for command in (
            'gh pr create --base development --body "plain"',
            ["gh", "pr", "create", "--base=development", "--body", "plain"],
        ):
            with self.subTest(command=command):
                self.assertIsNone(self.run_hook(command))

    def test_body_text_cannot_override_the_base(self) -> None:
        """Ignore base-like text inside the PR body."""
        output = self.run_hook('gh pr create --body "mentions --base missing"')
        self.assertEqual(output["hookSpecificOutput"]["permissionDecision"], "deny")


if __name__ == "__main__":
    unittest.main()
