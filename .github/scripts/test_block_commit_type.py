#!/usr/bin/env python3
"""Behavioral tests for the GitHub commit-type hook."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
HOOK = REPO_ROOT / "plugins" / "github-dev" / "hooks" / "scripts" / "block_commit_type.py"


class BlockCommitTypeTest(unittest.TestCase):
    """Test commit-type behavior."""

    def setUp(self) -> None:
        """Create a session directory holding a message file with a disallowed type."""
        self.cwd = self.enterContext(tempfile.TemporaryDirectory())
        (Path(self.cwd) / "msg.txt").write_text("chore: bump\n")

    def run_hook(self, command: str | list[str]) -> dict | None:
        """Run the hook with a shell command.

        Args:
            command (str | list[str]): Command supplied to the hook.

        Returns:
            (dict | None): Hook response when the command is denied.
        """
        result = subprocess.run(
            ["python3", str(HOOK)],
            input=json.dumps({"cwd": self.cwd, "tool_input": {"command": command}}),
            capture_output=True,
            check=True,
            text=True,
        )
        return json.loads(result.stdout) if result.stdout else None

    def test_disallowed_types_are_denied(self) -> None:
        """Deny a disallowed type wherever the commit message comes from."""
        for command in (
            'git commit -m "chore: bump"',
            'git commit -am "chore: bump"',
            "git commit -m \"$(cat <<'EOF'\nchore: bump\n\nbody\nEOF\n)\"",
            "git commit -F - <<'MSG'\nchore: bump\nMSG",
            "cat > notes.md <<'EOF'\nfeat: looks like a subject\nEOF\ngit add notes.md && git commit -m \"chore: bump\"",
            ["git", "commit", "-m", "chore: bump"],
            "git commit -F msg.txt",
            "git commit --file=msg.txt",
            "cat > new.txt <<'EOF'\nchore: bump\nEOF\ngit commit -F new.txt",
        ):
            with self.subTest(command=command):
                output = self.run_hook(command)
                self.assertEqual(output["hookSpecificOutput"]["permissionDecision"], "deny")

    def test_allowed_types_pass(self) -> None:
        """Allow an allowed type, including a heredoc message or one that rewrites the -F file."""
        for command in (
            'git commit -m "fix: guard"',
            "git commit -m \"$(cat <<'EOF'\nfeat: add hook\n\nbody\nEOF\n)\"",
            "cat > msg.txt <<'EOF'\nfix: tidy\nEOF\ngit commit -F msg.txt",
        ):
            with self.subTest(command=command):
                self.assertIsNone(self.run_hook(command))

    def test_other_heredocs_and_messages_are_not_the_commit_message(self) -> None:
        """Read only the message given to git commit, never file contents or other commands."""
        for command in (
            "cat > notes.md <<'EOF'\n# Notes\nEOF\ngit add notes.md && git commit -m \"docs: add notes\"",
            "cat > notes.md <<'EOF'\nrun it with -m \"wip\"\nEOF\ngit commit -m \"docs: add notes\"",
            "cat > notes.md <<'EOF' && git commit -m \"docs: add notes\"\n# Notes\nEOF",
            'git stash push -m "wip" && git commit -m "fix: tidy"',
            "python3 - <<'EOF'\ncases = ['a && git commit -m x']\nEOF",
        ):
            with self.subTest(command=command):
                self.assertIsNone(self.run_hook(command))


if __name__ == "__main__":
    unittest.main()
