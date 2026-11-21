#!/usr/bin/env python3
"""Behavioral tests for the GitHub commit-format hook."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
HOOK = REPO_ROOT / "plugins" / "github-dev" / "hooks" / "scripts" / "block_commit_format.py"


class BlockCommitFormatTest(unittest.TestCase):
    """Test commit-format behavior."""

    def setUp(self) -> None:
        """Create a session directory holding message files with a disallowed type."""
        self.cwd = self.enterContext(tempfile.TemporaryDirectory())
        for name in ("msg.txt", "my msg.txt"):
            (Path(self.cwd) / name).write_text("chore: bump\n")

    def run_hook(self, command: str) -> dict | None:
        """Run the hook with a shell command.

        Args:
            command (str): Command supplied to the hook.

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
            "git commit -F msg.txt",
            "git commit --file=msg.txt",
            "cat > new.txt <<'EOF'\nchore: bump\nEOF\ngit commit -F new.txt",
            "bash <<'EOF'\ngit commit -m 'chore: bump'\nEOF",
            "sh <<'EOF'\ngit commit -m 'chore: bump'\nEOF",
            "zsh <<'EOF'\ngit commit -m 'chore: bump'\nEOF",
            "bash <<'EOF'\ngit commit -F - <<'MSG'\nchore: bump\nMSG\nEOF",
            "bash -lc \"git commit -am 'chore: bump'\"",
            'git commit -sm "chore: bump"',
            'git commit -vam "chore: bump"',
            'git commit -am"chore: bump"',
            "git commit -aF msg.txt",
            'git commit -F "my msg.txt"',
            "cat <<'EOF' | git commit -F -\nchore: bump\nEOF",
            "echo 'chore: bump' | git commit -F -",
            'git commit -m "fix: tidy" && git commit --allow-empty -m "chore: bump"',
            "git commit -m \"chore: bump $(cat <<'EOF'\nfix: tidy\nEOF\n)\"",
            "git commit \\\n  -m 'chore: bump'",
        ):
            with self.subTest(command=command):
                output = self.run_hook(command)
                self.assertEqual(output["hookSpecificOutput"]["permissionDecision"], "deny")

    def test_missing_verification_is_denied(self) -> None:
        """Deny an allowed type whose message has no lowercase verification trailer."""
        for command in (
            'git commit -m "fix: guard"',
            "git commit -m \"$(cat <<'EOF'\nfeat: add hook\n\nbody\nEOF\n)\"",
            "git commit -F - <<'MSG'\nfix: tidy\n\nVerification: tests passed\nMSG",
            'git commit -m "fix: tidy" -m "verification:"',
            'git commit -m "fix: tidy" -m "verification: none (docs)" && git commit -m "docs: add notes"',
            'git commit -m "fix: tidy" -m "verification: lint passed" -m "more body"',
            'git commit -m "fix: tidy\nverification: lint passed"',
        ):
            with self.subTest(command=command):
                output = self.run_hook(command)
                self.assertIn("verification:", output["hookSpecificOutput"]["permissionDecisionReason"])

    def test_allowed_types_with_verification_pass(self) -> None:
        """Allow an allowed type with a verification trailer, including a heredoc or a rewritten -F file."""
        for command in (
            'git commit -m "fix: guard" -m "verification: none (docs only)"',
            "git commit -m \"$(cat <<'EOF'\nfeat: add hook\n\nbody\n\nverification: 3 tests passed\nEOF\n)\"",
            "cat > msg.txt <<'EOF'\nfix: tidy\n\nverification: lint passed\nEOF\ngit commit -F msg.txt",
            "cat > \"my msg.txt\" <<'EOF'\nfix: tidy\n\nverification: lint passed\nEOF\ngit commit -F \"my msg.txt\"",
            "bash <<'EOF'\ngit commit -m 'fix: tidy' -m 'verification: lint passed'\nEOF",
            "cat <<'EOF' | git commit -F -\nfix: tidy\n\nverification: lint passed\nEOF",
            "cat > ./msg.txt <<'EOF'\nfix: tidy\n\nverification: lint passed\nEOF\ngit commit -F msg.txt",
            "# don't forget to stage\ngit add . && git commit -m \"fix: close #12\" -m \"verification: none (typo)\"",
            "git commit --amend --no-edit",
            'git commit -m "fix: tidy" --trailer "verification=lint passed"',
            'git commit -m "fix: tidy" --trailer="verification: lint passed"',
            'git commit -m "fix: tidy" -m "verification: lint passed\nRef: #12"',
        ):
            with self.subTest(command=command):
                self.assertIsNone(self.run_hook(command))

    def test_other_heredocs_and_messages_are_not_the_commit_message(self) -> None:
        """Read only the message given to git commit, never file contents or other commands."""
        for command in (
            "cat > notes.md <<'EOF'\n# Notes\nEOF\ngit add notes.md && git commit -m \"docs: add notes\" -m \"verification: none (docs)\"",
            "cat > notes.md <<'EOF'\nrun it with -m \"wip\"\nEOF\ngit commit -m \"docs: add notes\" -m \"verification: none (docs)\"",
            "cat > notes.md <<'EOF' && git commit -m \"docs: add notes\" -m \"verification: none (docs)\"\n# Notes\nEOF",
            'git stash push -m "wip" && git commit -m "fix: tidy" -m "verification: none (typo)"',
            "python3 - <<'EOF'\ncases = ['a && git commit -m x']\nEOF",
            "cat > run.sh <<'EOF'\ngit commit -m 'chore: bump'\nEOF",
        ):
            with self.subTest(command=command):
                self.assertIsNone(self.run_hook(command))


if __name__ == "__main__":
    unittest.main()
