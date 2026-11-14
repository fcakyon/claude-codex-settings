#!/usr/bin/env python3
"""Check that bundled skills retain their linked reference files."""

import re
import tempfile
import unittest
from pathlib import Path

from antigravity import ROOT, package_plugin


class PackagingTests(unittest.TestCase):
    """Verify the installed QA skill contract."""

    def test_qa_reference_links_resolve_in_bundle(self):
        """Keep linked QA guidance in a fresh native bundle."""
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "qa"
            package_plugin(ROOT / "plugins/qa", target)
            self.assertTrue((target / "references/runner.md").is_file())
            for skill in (target / "skills").glob("*/SKILL.md"):
                for link in re.findall(r"\[[^\]]+\]\(([^)]+)\)", skill.read_text()):
                    if ":" not in link and not link.startswith("#"):
                        self.assertTrue(
                            (skill.parent / link.split("#")[0]).is_file(), link
                        )
            self.assertEqual(
                (target / "references/runner.md").read_bytes(),
                (ROOT / "plugins/qa/references/runner.md").read_bytes(),
            )


if __name__ == "__main__":
    unittest.main()
