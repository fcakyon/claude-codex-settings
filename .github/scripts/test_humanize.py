#!/usr/bin/env python3
"""Test humanize extraction and source locations."""

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

HOOK = Path(__file__).parents[2] / "plugins/humanize/hooks/scripts/humanize.py"
SEMICOLON = chr(59)


def run_hook(tool, tool_input):
    """Run humanize with one tool payload."""
    return subprocess.run(
        ["python3", HOOK],
        input=json.dumps({"tool_name": tool, "tool_input": tool_input}),
        capture_output=True,
        check=True,
        text=True,
    ).stdout


class HumanizeTest(unittest.TestCase):
    """Test that humanize checks writing without mistaking code for it."""

    def test_masks_markdown_code(self):
        """Mask closed, incomplete, and multi-backtick Markdown code."""
        fence = "`" * 3
        for content in (
            f"Intro.\n{fence}js\nconst a = 1{SEMICOLON}\n{fence}\n",
            f"Intro.\n{fence}js\nconst a = 1{SEMICOLON}\n",
            f"Use ``leverage`this{SEMICOLON}`` in a sentence.\n",
        ):
            self.assertEqual(run_hook("Write", {"file_path": "README.md", "content": content}), "")

    def test_ignores_ambiguous_text_files(self):
        """Ignore generic text files that may contain logs or fixtures."""
        self.assertEqual(
            run_hook("Write", {"file_path": "fixture.txt", "content": f"GET /a 200{SEMICOLON} GET /b 404{SEMICOLON}"}),
            "",
        )

    def test_comments_are_quote_aware(self):
        """Ignore comment markers inside quoted values and strings."""
        cases = (
            ("config.yml", f'motd: "welcome # to prod{SEMICOLON} be careful"\n'),
            ("app.ts", f'const note = "see {"/" * 2} ref{SEMICOLON} here"{SEMICOLON}\n'),
        )
        for path, content in cases:
            self.assertEqual(run_hook("Write", {"file_path": path, "content": content}), "")

    def test_checks_real_writing(self):
        """Keep blocking marks in Markdown and code comments."""
        cases = (
            ("README.md", f"This sentence has a semicolon{SEMICOLON} replace it."),
            ("config.yml", f"# This comment has a semicolon{SEMICOLON} replace it."),
            ("app.ts", f"{'/' * 2} This comment has a semicolon{SEMICOLON} replace it."),
        )
        for path, content in cases:
            self.assertTrue(run_hook("Write", {"file_path": path, "content": content}))

    def test_applies_markdown_edits_with_file_context(self):
        """Use the full Markdown file to classify edited text."""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "README.md"
            path.write_text(f"Intro.\n```js\nconst value = 1{SEMICOLON}\n```\nOld sentence.\n")
            code_edit = {
                "file_path": str(path),
                "old_string": f"const value = 1{SEMICOLON}",
                "new_string": f"const value = 2{SEMICOLON}",
            }
            prose_edit = {
                "file_path": str(path),
                "old_string": "Old sentence.",
                "new_string": f"New{SEMICOLON} sentence.",
            }
            self.assertEqual(run_hook("Edit", code_edit), "")
            self.assertTrue(run_hook("Edit", prose_edit))

    def test_applies_markdown_patches_with_file_context(self):
        """Use the full Markdown file to classify patched text."""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "README.md"
            path.write_text(f"Intro.\n```js\nconst value = 1{SEMICOLON}\n```\n")
            patch = (
                f"*** Begin Patch\n*** Update File: {path}\n@@\n ```js\n"
                f"-const value = 1{SEMICOLON}\n+const value = 2{SEMICOLON}\n ```\n*** End Patch"
            )
            self.assertEqual(run_hook("apply_patch", {"command": patch}), "")


if __name__ == "__main__":
    unittest.main()
