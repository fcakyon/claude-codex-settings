#!/usr/bin/env python3
"""Test humanize extraction and source locations."""

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

HOOK = Path(__file__).parents[2] / "plugins/humanize/hooks/scripts/humanize.py"
EMDASH = "\u2014"
SEMICOLON = chr(59)


def run_hook(tool, tool_input):
    """Run humanize with one tool payload."""
    output = subprocess.run(
        ["python3", HOOK],
        input=json.dumps({"tool_name": tool, "tool_input": tool_input}),
        capture_output=True,
        check=True,
        text=True,
    ).stdout
    return json.loads(output)["hookSpecificOutput"]["permissionDecisionReason"] if output else ""


class HumanizeTest(unittest.TestCase):
    """Test that humanize checks writing without mistaking code for it."""

    def test_masks_markdown_code(self):
        """Mask closed, incomplete, and multi-backtick Markdown code."""
        fence = "`" * 3
        for content in (
            f"Intro.\n{fence}js\nconst a = 1{EMDASH}\n{fence}\n",
            f"Intro.\n{fence}js\nconst a = 1{EMDASH}\n",
            f"Use ``leverage`this{EMDASH}`` in a sentence.\n",
        ):
            self.assertEqual(run_hook("Write", {"file_path": "README.md", "content": content}), "")

    def test_ignores_ambiguous_text_files(self):
        """Ignore generic text files that may contain logs or fixtures."""
        self.assertEqual(
            run_hook("Write", {"file_path": "fixture.txt", "content": f"GET /a 200{EMDASH} GET /b 404{EMDASH}"}),
            "",
        )

    def test_comments_are_quote_aware(self):
        """Ignore comment markers inside quoted values and strings."""
        cases = (
            ("config.yml", f'motd: "welcome # to prod{EMDASH} be careful"\n'),
            ("app.ts", f'const note = "see {"/" * 2} ref{EMDASH} here"{SEMICOLON}\n'),
        )
        for path, content in cases:
            self.assertEqual(run_hook("Write", {"file_path": path, "content": content}), "")

    def test_checks_real_writing(self):
        """Keep blocking marks in Markdown and code comments."""
        cases = (
            ("README.md", f"This sentence has an em dash{EMDASH} replace it."),
            ("config.yml", f"# This comment has an em dash{EMDASH} replace it."),
            ("app.ts", f"{'/' * 2} This comment has an em dash{EMDASH} replace it."),
        )
        for path, content in cases:
            self.assertTrue(run_hook("Write", {"file_path": path, "content": content}))

    def test_applies_markdown_edits_with_file_context(self):
        """Use the full Markdown file to classify edited text."""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "README.md"
            path.write_text(f"Intro.\n```js\nconst value = 1{EMDASH}\n```\nOld sentence.\n")
            code_edit = {
                "file_path": str(path),
                "old_string": f"const value = 1{EMDASH}",
                "new_string": f"const value = 2{EMDASH}",
            }
            prose_edit = {
                "file_path": str(path),
                "old_string": "Old sentence.",
                "new_string": f"New{EMDASH} sentence.",
            }
            self.assertEqual(run_hook("Edit", code_edit), "")
            self.assertIn(f"{path}:5:4", run_hook("Edit", prose_edit))

    def test_applies_markdown_patches_with_file_context(self):
        """Use the full Markdown file to classify patched text."""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "README.md"
            path.write_text(f"Intro.\n```js\nconst value = 1{EMDASH}\n```\nOld sentence.\n")
            code_patch = (
                f"*** Begin Patch\n*** Update File: {path}\n@@\n ```js\n"
                f"-const value = 1{EMDASH}\n+const value = 2{EMDASH}\n ```\n*** End Patch"
            )
            prose_patch = (
                f"*** Begin Patch\n*** Update File: {path}\n@@\n ```\n"
                f"-Old sentence.\n+New{EMDASH} sentence.\n*** End Patch"
            )
            self.assertEqual(run_hook("apply_patch", {"command": code_patch}), "")
            self.assertIn(f"{path}:5:4", run_hook("apply_patch", {"command": prose_patch}))

    def test_reports_each_file_location_with_context(self):
        """Report every file finding with line, column, fix, and context."""
        reason = run_hook(
            "Write",
            {
                "file_path": "README.md",
                "content": f"First line.\nAI sections{EMDASH} it does not{EMDASH}\nWe leverage tools.\nIn conclusion, done.\n",
            },
        )
        self.assertIn(
            "- em-dash at README.md:2:12, use commas or periods: "
            + json.dumps(f"AI sections{EMDASH} it does not{EMDASH}"),
            reason,
        )
        self.assertEqual(reason.count("- em-dash at"), 2)
        self.assertIn('"leverage" at README.md:3:4, use "use"', reason)
        self.assertIn('"In conclusion" at README.md:4:1, drop it', reason)

    def test_caps_pileup_locations(self):
        """Report five pile-up locations and count the remainder."""
        content = "\n".join(f"crucial item {i}" for i in range(7))
        reason = run_hook("Write", {"file_path": "README.md", "content": content})
        self.assertIn('"crucial" used 7 times', reason)
        self.assertIn("README.md:5:1, +2 more", reason)
        self.assertNotIn("README.md:6:1", reason)

    def test_labels_non_file_sources(self):
        """Label PR, Slack, and heredoc findings by their real source."""
        cases = (
            ("Bash", {"command": f'gh pr create -b "One{EMDASH} two"'}, "PR body:1:4"),
            (
                "mcp__claude_ai_Slack__slack_send_message",
                {"message": f"One{EMDASH} two"},
                "Slack message:1:4",
            ),
            (
                "mcp__codex_apps__slack_slack_send_message",
                {"message": {"markdown_text": f"One{EMDASH} two"}},
                "Slack message:1:4",
            ),
            (
                "Bash",
                {"command": f"cat > notes.md <<'EOF'\nOne{EMDASH} two\nEOF"},
                "notes.md:1:4",
            ),
        )
        for tool, tool_input, source in cases:
            self.assertIn(source, run_hook(tool, tool_input))

    def test_checks_github_close_comments_from_shell_tools(self):
        """Check close comments from Claude and Codex shell calls."""
        cases = (
            ("Bash", {"command": f'gh pr close 106 --comment "Old{EMDASH} new"'}),
            ("exec_command", {"cmd": f'gh issue close 105 -c "Fixed{EMDASH} thanks"'}),
        )
        for tool, tool_input in cases:
            self.assertIn("em-dash at GitHub comment:1:", run_hook(tool, tool_input))
        self.assertEqual(run_hook("Bash", {"command": "gh pr review 106 -c"}), "")
        self.assertEqual(run_hook("Bash", {"command": "gh pr close 106 && gh pr review 106 -c"}), "")
        self.assertEqual(run_hook("exec_command", {"cmd": "git status --short"}), "")

    def test_allows_semicolons(self):
        """Allow ordinary semicolons in prose, comments, and commit messages."""
        cases = (
            ("Write", {"file_path": "README.md", "content": f"Fixed the timeout{SEMICOLON} added a retry.\n"}),
            ("Write", {"file_path": "app.php", "content": f"// call $db->begin(){SEMICOLON} then commit()\n"}),
            ("Write", {"file_path": "main.css", "content": f"/* was: display: none{SEMICOLON} now in main.css */\n"}),
            ("Bash", {"command": f"git commit -m 'Fix timeout{SEMICOLON} add retry'"}),
        )
        for tool, tool_input in cases:
            self.assertEqual(run_hook(tool, tool_input), "")


if __name__ == "__main__":
    unittest.main()
