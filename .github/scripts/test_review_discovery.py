#!/usr/bin/env python3
"""Exercise the review discovery skill with real gh and local GitHub responses."""

from __future__ import annotations

import json
import os
import re
import ssl
import subprocess
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SKILL = REPO_ROOT / "plugins/github-dev/skills/resolve-pr-comments/SKILL.md"


def thread(identifier: str, resolved: bool, outdated: bool) -> dict:
    """Build a GitHub review thread response."""
    return {
        "id": identifier,
        "isResolved": resolved,
        "isOutdated": outdated,
        "path": "example.py",
        "line": None if outdated else 7,
        "comments": {"nodes": [{
            "id": "comment-" + identifier,
            "databaseId": len(identifier),
            "url": "https://github.com/fixture/repo/pull/42#discussion_" + identifier,
            "body": "Review finding " + identifier,
            "author": {"login": "reviewer"},
        }]},
    }


def rows_from_pages(output: str) -> list[dict]:
    """Read the JSON arrays emitted by gh for successive pages."""
    decoder = json.JSONDecoder()
    rows = []
    while output.strip():
        output = output.lstrip()
        page, end = decoder.raw_decode(output)
        rows.extend(page)
        output = output[end:]
    return rows


class ReviewDiscoveryTest(unittest.TestCase):
    """Verify thread discovery without GitHub access or account credentials."""

    @classmethod
    def setUpClass(cls) -> None:
        """Create a temporary trust certificate for the local GitHub host."""
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.temp_dir.cleanup)
        cls.fixture_dir = Path(cls.temp_dir.name)
        cls.certificate = cls.fixture_dir / "cert.pem"
        cls.key = cls.fixture_dir / "key.pem"
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
            "-keyout", str(cls.key), "-out", str(cls.certificate),
            "-days", "1", "-subj", "/CN=localhost",
            "-addext", "subjectAltName=DNS:localhost",
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def run_recipe(
        self, pages: list[list[dict]], *, failure: bool = False, missing: bool = False,
    ) -> tuple[subprocess.CompletedProcess, list[dict]]:
        """Run the documented command against a local paginated API."""
        requests = []

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def respond(self, payload):
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(payload).encode())

            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                requests.append(body)
                if not body["query"].lstrip().startswith("query"):
                    self.respond({"errors": [{"message": "fixture allows queries only"}]})
                    return
                cursor = body.get("variables", {}).get("endCursor")
                index = 0 if cursor is None else 1
                if failure and index == 1:
                    self.respond({"errors": [{"message": "fixture later-page failure"}]})
                    return
                has_next = index + 1 < len(pages)
                connection = {
                    "pageInfo": {
                        "hasNextPage": has_next,
                        "endCursor": "page2" if has_next else "end",
                    },
                    "nodes": pages[index],
                }
                self.respond({"data": {"repository": {
                    "pullRequest": None if missing else {"reviewThreads": connection}
                }}})

        recipe = re.findall(r"```bash\n(.*?)```", SKILL.read_text(), re.S)[0]
        with HTTPServer(("127.0.0.1", 0), Handler) as server:
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain(self.certificate, self.key)
            server.socket = context.wrap_socket(server.socket, server_side=True)
            worker = threading.Thread(target=server.serve_forever, daemon=True)
            worker.start()
            try:
                result = subprocess.run(
                    ["bash", "-eu", "-c", recipe],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    cwd=self.fixture_dir,
                    env={
                        "PATH": os.environ["PATH"],
                        "HOME": str(self.fixture_dir),
                        "XDG_STATE_HOME": str(self.fixture_dir / "state"),
                        "GH_CONFIG_DIR": str(self.fixture_dir / "gh-config"),
                        "GH_TOKEN": "local-fixture-only",
                        "GH_ENTERPRISE_TOKEN": "local-fixture-only",
                        "GH_HOST": f"localhost:{server.server_port}",
                        "SSL_CERT_FILE": str(self.certificate),
                        "owner": "fixture",
                        "repo": "repo",
                        "number": "42",
                    },
                )
            finally:
                server.shutdown()
                worker.join()
        return result, requests

    def test_resolution_outdated_and_later_page(self) -> None:
        """Include outdated unresolved threads and findings beyond the first page."""
        result, requests = self.run_recipe([
            [thread("open-current", False, False), thread("resolved-current", True, False),
             thread("open-outdated", False, True), thread("resolved-outdated", True, True)],
            [thread("later-open", False, False)],
        ])
        self.assertEqual(result.returncode, 0, result.stderr)
        rows = rows_from_pages(result.stdout)
        self.assertEqual([row["id"] for row in rows],
                         ["open-current", "open-outdated", "later-open"])
        self.assertEqual([row["isOutdated"] for row in rows], [False, True, False])
        self.assertEqual([row["isResolved"] for row in rows], [False, False, False])
        self.assertEqual(rows[1]["comments"]["nodes"][0]["body"],
                         "Review finding open-outdated")
        self.assertEqual([r.get("variables", {}).get("endCursor") for r in requests],
                         [None, "page2"])
        self.assertTrue(all(r["query"].lstrip().startswith("query") for r in requests))

    def test_no_threads(self) -> None:
        """Report an empty successful fetch as empty."""
        result, _ = self.run_recipe([[]])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(rows_from_pages(result.stdout), [])

    def test_all_resolved(self) -> None:
        """Exclude a PR's already resolved threads."""
        result, _ = self.run_recipe([[thread("resolved", True, False)]])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(rows_from_pages(result.stdout), [])

    def test_later_page_failure_is_not_clean(self) -> None:
        """Fail discovery when a later page returns a GraphQL error."""
        result, _ = self.run_recipe([[], []], failure=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("fixture later-page failure", result.stderr)

    def test_missing_pr_is_not_clean(self) -> None:
        """Fail discovery for a missing pull request."""
        result, _ = self.run_recipe([[]], missing=True)
        self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
