#!/usr/bin/env python3
"""Load every plugin with the Claude Code and Codex CLIs and fail on anything they reject, warn about, or drop."""

from __future__ import annotations

import argparse
import json
import os
import queue
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

from antigravity import ROOT, parse_frontmatter
from validate_plugins import CODEX_MARKETPLACE, load_json

CLAUDE_IGNORED = (
    # existing plugin names are kept so installs keep updating, new plugins must avoid the reserved prefixes
    "is reserved: it passes as one of Anthropic's own",
    # author is optional for third-party plugins
    "No author information provided",
)


def claude_findings(target: Path) -> list[str]:
    """Return the errors and warnings `claude plugin validate` reports for a marketplace or plugin directory.

    Args:
        target (Path): Marketplace root or plugin directory.

    Returns:
        (list[str]): One line per finding, without the ignored kinds.
    """
    result = subprocess.run(["claude", "plugin", "validate", str(target), "--json"], capture_output=True, text=True)
    report = json.loads(result.stdout)
    return [
        f"{Path(section['file']).relative_to(ROOT)}: {item.get('path') or ''} {item['message']}"
        for section in (report["manifest"], *report["contents"])
        for item in (*section["errors"], *section["warnings"])
        if not any(text in item["message"] for text in CLAUDE_IGNORED)
    ]


def codex_lists(cwd: Path) -> tuple[dict, dict]:
    """Return what a stdio Codex app-server reports for hooks/list and skills/list.

    Args:
        cwd (Path): Directory the app-server lists hooks and skills for.

    Returns:
        hooks (dict): hooks/list entry with hooks, warnings and errors.
        skills (dict): skills/list entry with skills and errors.
    """
    proc = subprocess.Popen(
        ["codex", "app-server"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        cwd=cwd,
    )
    # a reader thread, since select() misses lines readline() already pulled into the pipe buffer
    lines = queue.Queue()

    def pump() -> None:
        """Move each app-server stdout line onto the queue until the pipe closes."""
        for line in proc.stdout:
            lines.put(line)

    threading.Thread(target=pump, daemon=True).start()

    def call(request: int, method: str, params: dict) -> dict:
        """Send one JSON-RPC request and wait up to 60 seconds for its result."""
        proc.stdin.write(json.dumps({"id": request, "method": method, "params": params}) + "\n")
        proc.stdin.flush()
        while True:
            message = json.loads(lines.get(timeout=60))
            if message.get("id") == request:
                return message["result"]

    call(0, "initialize", {"clientInfo": {"name": "ci", "version": "0"}})
    proc.stdin.write(json.dumps({"method": "initialized"}) + "\n")
    hooks = call(1, "hooks/list", {"cwds": [str(cwd)]})["data"][0]
    skills = call(2, "skills/list", {"cwds": [str(cwd)], "forceReload": True})["data"][0]
    proc.kill()
    proc.wait()
    return hooks, skills


def codex_findings(home: Path) -> list[str]:
    """Install the Codex marketplace into an empty home and report what Codex rejects or silently drops.

    Args:
        home (Path): Empty directory used as HOME and CODEX_HOME parent.

    Returns:
        (list[str]): One line per problem.
    """
    marketplace = load_json(CODEX_MARKETPLACE)
    entries = marketplace["plugins"]
    run = {"capture_output": True, "text": True}
    if (added := subprocess.run(["codex", "plugin", "marketplace", "add", str(ROOT)], **run)).returncode:
        return [f"codex plugin marketplace add: {added.stderr.strip()}"]
    available = subprocess.run(["codex", "plugin", "list", "--json", "--available"], **run).stdout
    listed = {p["name"] for p in json.loads(available)["available"]}
    findings = [f"marketplace entry dropped by Codex: {e['name']}" for e in entries if e["name"] not in listed]
    for name in sorted(listed):
        if (installed := subprocess.run(["codex", "plugin", "add", f"{name}@{marketplace['name']}"], **run)).returncode:
            findings.append(f"codex plugin add {name}: {installed.stderr.strip()}")

    hooks, skills = codex_lists(home)
    findings += [f"hook: {item}" for item in (*hooks["warnings"], *hooks["errors"])]
    findings += [f"skill: {item['path']}: {item['message']}" for item in skills["errors"]]
    plugins = {e["name"]: ROOT / e["source"]["path"] for e in entries}
    # Codex turns each command into a source-command-<stem> skill and drops oversized ones without an error
    expected = {
        f"{name}:{parse_frontmatter(skill.read_text())[0]['name']}"
        for name, directory in plugins.items()
        for skill in directory.glob("skills/*/SKILL.md")
    } | {f"{name}:source-command-{c.stem}" for name, directory in plugins.items() for c in directory.glob("commands/*.md")}
    loaded = {s["name"] for s in skills["skills"] if ":" in s["name"]}  # names without ":" are Codex built-ins
    findings += [f"skill missing or renamed in Codex: {s}" for s in sorted(expected - loaded)]
    findings += [f"unexpected Codex skill: {s}" for s in sorted(loaded - expected)]
    return findings


def main() -> None:
    """Run the selected provider checks in a throwaway home and exit non-zero on any finding."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("providers", nargs="*", choices=("claude", "codex"), help="defaults to both")
    providers = parser.parse_args().providers or ["claude", "codex"]
    with tempfile.TemporaryDirectory(prefix="providers-") as directory:
        home = Path(directory)
        (home / ".codex").mkdir()
        os.environ.update(HOME=str(home), CODEX_HOME=str(home / ".codex"))
        findings = []
        if "claude" in providers:
            targets = [ROOT, *sorted(p for p in (ROOT / "plugins").iterdir() if (p / ".claude-plugin").is_dir())]
            findings += [f"claude: {line}" for target in targets for line in claude_findings(target)]
        if "codex" in providers:
            findings += [f"codex: {line}" for line in codex_findings(home)]
    findings = list(dict.fromkeys(findings))  # a marketplace and its plugin report the same file twice
    print("\n".join(findings) or f"{', '.join(providers)}: all plugins load cleanly")
    sys.exit(1 if findings else 0)


if __name__ == "__main__":
    main()
