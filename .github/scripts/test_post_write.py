#!/usr/bin/env python3
"""Behavioral tests for the ultralytics-dev format hook."""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
HOOK = REPO_ROOT / "plugins" / "ultralytics-dev" / "hooks" / "scripts" / "post_write.py"
CODE_BLOCKS = "ultralytics-actions-update-markdown-code-blocks"
PRETTIER = "prettier@3.9.9 --write --list-different --print-width 120 --no-error-on-unmatched-pattern"
BIOME = "@biomejs/biome@latest check --write"
PRETTIER_IGNORED = "!**/*lock.{{json,yaml,yml}} !**/*.lock !**/model.json !**/*.min.js !**/*.min.css"
RUFF = ["ruff check --fix --unsafe-fixes", "ruff format"]
# repo path -> fragments of the tool calls the hook makes for it, in order
ROUTES = {
    "pkg/model.py": [*RUFF, "ultralytics-actions-format-python-docstrings"],
    "scripts/run.sh": ["shfmt -i 2 -sr -bn -ci -l -w"],
    "scripts/run.bash": [],
    "web/site.css": [PRETTIER],
    "web/app.ts": [PRETTIER],
    "package-lock.json": [f"{PRETTIER} {{path}} {PRETTIER_IGNORED}"],
    "web/vendor.min.js": [f"{PRETTIER} {{path}} {PRETTIER_IGNORED}"],
    "README.md": [CODE_BLOCKS, f"{PRETTIER} {{path}}"],
    "docs/en/index.md": [CODE_BLOCKS, f"{PRETTIER} --tab-width 4 {{path}}"],
    "docs/en/reference/api.md": [CODE_BLOCKS],
    "pkg/docs/notes.md": [CODE_BLOCKS],
    # the docstring and shfmt passes prune these folders as upstream does, ruff and Prettier apply their own excludes
    "node_modules/lib/index.js": [PRETTIER],
    "node_modules/lib/run.sh": [],
    ".venv/lib/site.py": RUFF,
    "build/out.py": RUFF,
}
# repo path -> tool call fragments in a biome.json repo whose workflow sets biome: true
BIOME_ROUTES = {
    "web/app.ts": [BIOME],
    "web/site.css": [BIOME, PRETTIER],
    "docs/en/reference/api.md": [BIOME, CODE_BLOCKS],
}


class PostWriteTest(unittest.TestCase):
    """Test which upstream formatter the hook runs on each changed file."""

    def setUp(self) -> None:
        """Create a repo under folders named like excluded ones and tool stubs that log their arguments."""
        base = Path(self.enterContext(tempfile.TemporaryDirectory()))
        self.repo = base / "build" / ".claude" / "worktrees" / "repo"
        self.repo.mkdir(parents=True)
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        self.log = base / "calls.log"
        bin_dir = base / "bin"
        bin_dir.mkdir()
        for tool in ("uvx", "npx", "shfmt"):
            (bin_dir / tool).write_text(f'#!/bin/sh\necho "${{0##*/}} $*" >> "{self.log}"\n')
            (bin_dir / tool).chmod(0o755)
        self.env = {**os.environ, "PATH": f"{bin_dir}{os.pathsep}{os.environ['PATH']}"}

    def write(self, rel: str) -> Path:
        """Create a file in the repo.

        Args:
            rel (str): File path relative to the repo.

        Returns:
            (Path): Absolute file path.
        """
        path = self.repo / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("x\n")
        return path

    def calls(self, tool_input: dict) -> list[str]:
        """Run the hook on one tool input.

        Args:
            tool_input (dict): Write tool input.

        Returns:
            (list[str]): Logged tool calls.
        """
        self.log.write_text("")
        payload = json.dumps({"tool_input": tool_input})
        subprocess.run(["python3", str(HOOK)], input=payload, text=True, env=self.env, check=True)
        return self.log.read_text().splitlines()

    def assert_calls(self, rel: str, fragments: list[str]) -> None:
        """Assert the hook's tool calls for one file.

        Args:
            rel (str): File path relative to the repo.
            fragments (list[str]): Text each call must contain, in order.
        """
        path = self.write(rel)
        calls = self.calls({"file_path": str(path)})
        self.assertEqual(len(calls), len(fragments), calls)
        for call, fragment in zip(calls, fragments):
            self.assertIn(fragment.format(path=path), call)

    def test_routes_each_file_to_its_upstream_formatter(self) -> None:
        """Route each file to the formatter and options the format job uses for its repo path."""
        for rel, fragments in ROUTES.items():
            with self.subTest(rel=rel):
                self.assert_calls(rel, fragments)

    def test_runs_biome_first_only_when_the_workflow_turns_it_on(self) -> None:
        """Run Biome before Prettier only when a biome.json repo's workflow sets biome: true."""
        (self.repo / "biome.json").write_text("{}\n")
        workflow = self.write(".github/workflows/format.yml")
        for setting in ("false", "true"):
            with self.subTest(biome=setting):
                workflow.write_text(f"steps:\n  - uses: ultralytics/actions@main\n    with:\n      biome: {setting}\n")
                for rel, fragments in BIOME_ROUTES.items():
                    self.assert_calls(rel, fragments if setting == "true" else ROUTES[rel])

    def test_formats_a_moved_file_at_its_new_path(self) -> None:
        """Format a file a Codex patch moves at its Move to path."""
        moved = self.write("pkg/new.py")
        patch = f"*** Begin Patch\n*** Update File: {self.repo / 'pkg/old.py'}\n*** Move to: {moved}\n@@\n-x\n+x\n*** End Patch"
        calls = self.calls({"command": patch})
        self.assertEqual(len(calls), 3, calls)
        self.assertTrue(all(call.endswith(str(moved)) for call in calls), calls)


if __name__ == "__main__":
    unittest.main()
