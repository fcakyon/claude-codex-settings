#!/usr/bin/env python3
"""Fetch Overleaf review comments, sync projects with GitHub, and compile them.

Usage:
    python3 overleaf.py <project> [--repo .] [--json] [--unresolved-only]
    python3 overleaf.py <project> [--sync-github] [--push MESSAGE] [--compile] [--download-pdf PATH] [--json]
    python3 overleaf.py --check-auth
    python3 overleaf.py --list-projects

`<project>` is the 24-char hex project ID or the full project URL.

Auth: uses the first `overleaf_session2` cookie that authenticates, from:
    1. OVERLEAF_COOKIE env var
    2. ~/.claude/overleaf-skills/cookie file (chmod 600)
    3. A logged-in Chrome read through `agent-browser`, either the local Chrome or the Chrome
       on the SSH host named by OVERLEAF_CHROME_SSH_HOST. A cookie found there is saved to 2.

Cookie name on current Overleaf is `overleaf_session2` (underscore). The legacy
`overleaf.session2` (dot) name no longer authenticates. Sessions slide ~5 days
idle and refresh on use.

Each comment is anchored to its highlighted snippet (`op.c` field of the range),
and the script locates that snippet in *.tex files under the repo root.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

OVERLEAF_BASE = "https://www.overleaf.com"
COOKIE_FILE = Path.home() / ".claude" / "overleaf-skills" / "cookie"
PORT_FILES = (
    ".config/google-chrome/DevToolsActivePort",
    "Library/Application Support/Google/Chrome/DevToolsActivePort",
)
CHROME_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
REFRESH_HINT = (
    "\nNo Overleaf session found in OVERLEAF_COOKIE, the cookie file, or a logged-in Chrome via agent-browser.\n"
    "Log into overleaf.com in Chrome and rerun, or ask Claude to 'set up overleaf'.\n"
)


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Block redirects so 302 -> /login surfaces as 302, not silent HTML."""

    def http_error_302(self, req, fp, code, msg, headers):
        return fp

    http_error_301 = http_error_303 = http_error_307 = http_error_302


OPENER = urllib.request.build_opener(_NoRedirect)


def _request(
    path: str,
    cookie: str,
    method: str = "GET",
    body: dict[str, Any] | None = None,
    csrf_token: str | None = None,
    accept: str = "application/json",
    check: bool = True,
) -> tuple[int, bytes]:
    """Issue an HTTP request against Overleaf with the session cookie.

    Args:
        path (str): URL path starting with `/`.
        cookie (str): `overleaf_session2=<value>` cookie header.
        method (str, optional): HTTP method.
        body (dict[str, Any] | None, optional): JSON request payload.
        csrf_token (str | None, optional): Overleaf CSRF token for mutating requests.
        accept (str, optional): `Accept` header value.
        check (bool, optional): Exit with the status and response body unless the status is 200.

    Returns:
        status (int): HTTP status code.
        data (bytes): Raw response body.
    """
    headers = {"Cookie": cookie, "Accept": accept, "User-Agent": CHROME_UA}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if csrf_token:
        headers["X-Csrf-Token"] = csrf_token
    req = urllib.request.Request(
        OVERLEAF_BASE + path,
        data=None if body is None else json.dumps(body).encode(),
        headers=headers,
        method=method,
    )
    try:
        resp = OPENER.open(req)
    except urllib.error.HTTPError as err:
        resp = err
    status, data = resp.status, resp.read()
    if check and status != 200:
        sys.exit(
            f"{path} failed: status={status} {data.decode(errors='replace').strip()[:300]}"
        )
    return status, data


def read_chrome_cookie() -> str:
    """Read the `overleaf_session2` value from a logged-in Chrome through `agent-browser`.

    Returns:
        (str): Cookie value, or an empty string when no reachable Chrome holds one.
    """
    host = os.environ.get("OVERLEAF_CHROME_SSH_HOST")
    local = next((p for p in (Path.home() / f for f in PORT_FILES) if p.exists()), None)
    if not shutil.which("agent-browser") or not (local or host):
        return ""
    port_text = (
        local.read_text()
        if local
        else subprocess.run(
            [
                "ssh",
                "-o",
                "BatchMode=yes",
                "-o",
                "ConnectTimeout=5",
                host,
                f'cat "$HOME/{PORT_FILES[1]}"',
            ],
            capture_output=True,
            text=True,
        ).stdout
    )
    lines = port_text.split()
    if len(lines) < 2:
        return ""
    port, ws_path = lines[:2]
    tunnel = None
    if not local:
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            local_port = sock.getsockname()[1]
        tunnel = subprocess.Popen(
            [
                "ssh",
                "-N",
                "-o",
                "BatchMode=yes",
                "-o",
                "ExitOnForwardFailure=yes",
                "-L",
                f"{local_port}:127.0.0.1:{port}",
                host,
            ],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for _ in range(30):
            with socket.socket() as sock:
                if sock.connect_ex(("127.0.0.1", local_port)) == 0:
                    break
            time.sleep(0.1)
        port = local_port
    session = f"overleaf-auth-{os.getpid()}"

    def ab(*cmd: str) -> str:
        """Run one `agent-browser` command in this session and return its stdout."""
        return subprocess.run(
            ["agent-browser", "--session", session, *cmd],
            capture_output=True,
            text=True,
            timeout=15,
        ).stdout

    opened_tab = None
    try:
        tabs = ab(
            "--pin-tab", "--cdp", f"ws://127.0.0.1:{port}{ws_path}", "tab", "list"
        )
        blank = re.search(r"→\s*\[(t\d+)\]\s+about:blank", tabs)
        existing = re.search(r"\[(t\d+)\][^\n]*https://www\.overleaf\.com", tabs)
        if not existing:
            opened = re.search(
                r"\[(t\d+)\]", ab("tab", "new", f"{OVERLEAF_BASE}/project")
            )
            opened_tab = opened.group(1) if opened else None
        if blank and blank.group(1) != opened_tab:
            ab("tab", "close", blank.group(1))
        if existing:
            ab("tab", existing.group(1))
        cookies = (
            json.loads(ab("cookies", "get", "--json") or "{}").get("data") or {}
        ).get("cookies", [])
        return next(
            (c["value"] for c in cookies if c["name"] == "overleaf_session2"), ""
        )
    finally:
        if opened_tab:
            ab("tab", "close", opened_tab)
        ab("close")
        if tunnel:
            tunnel.terminate()
            tunnel.wait(timeout=5)


def load_cookie() -> tuple[str, str]:
    """Return the first authenticating `overleaf_session2` cookie, reading Chrome only as the last source.

    Returns:
        cookie (str): `overleaf_session2=<value>` cookie header.
        email (str): Account email of the session.
    """
    sources = (
        lambda: os.environ.get("OVERLEAF_COOKIE", ""),
        lambda: COOKIE_FILE.read_text() if COOKIE_FILE.exists() else "",
        read_chrome_cookie,
    )
    for source in sources:
        raw = source().strip()
        if not raw:
            continue
        cookie = (
            raw if raw.startswith("overleaf_session2=") else f"overleaf_session2={raw}"
        )
        status, body = _request("/user/personal_info", cookie, check=False)
        if status == 200:
            if source is read_chrome_cookie:
                COOKIE_FILE.parent.mkdir(parents=True, exist_ok=True)
                COOKIE_FILE.write_text(f"{cookie}\n")
                COOKIE_FILE.chmod(0o600)
            return cookie, json.loads(body).get("email", "<unknown>")
    sys.exit(REFRESH_HINT)


def fetch_csrf_token(cookie: str, project_id: str) -> str:
    """Fetch `ol-csrfToken` from the project editor page.

    Args:
        cookie (str): `overleaf_session2=<value>` cookie header.
        project_id (str): 24-character Overleaf project ID.

    Returns:
        (str): Extracted CSRF token.
    """
    _, body = _request(f"/project/{project_id}", cookie, accept="text/html")
    match = re.search(
        r'ol-csrfToken"\s+content="([^"]+)"', body.decode(errors="replace")
    )
    if not match:
        sys.exit(f"Could not find ol-csrfToken on /project/{project_id}")
    return match.group(1)


def list_projects(cookie: str) -> list[dict[str, Any]]:
    """Return a sorted list of `{_id, name, accessLevel}` project dictionaries.

    Args:
        cookie (str): `overleaf_session2=<value>` cookie header.

    Returns:
        (list[dict[str, Any]]): Sorted project records.
    """
    _, body = _request("/user/projects", cookie)
    return sorted(
        json.loads(body).get("projects", []),
        key=lambda p: (p.get("name") or "").lower(),
    )


def sync_github(
    cookie: str, project_id: str, csrf_token: str, push_message: str | None = None
) -> dict[str, Any]:
    """Pull unmerged GitHub commits into Overleaf, or push Overleaf changes to GitHub.

    Args:
        cookie (str): `overleaf_session2=<value>` cookie header.
        project_id (str): 24-character Overleaf project ID.
        csrf_token (str): Overleaf CSRF token for the merge request.
        push_message (str | None, optional): Commit message when pushing Overleaf changes to GitHub.

    Returns:
        (dict[str, Any]): Sync summary with repository name, direction, and pulled commit metadata.
    """
    sync_info = json.loads(
        _request(f"/project/{project_id}/github-sync/status", cookie)[1]
    )
    if not sync_info.get("enabled"):
        sys.exit(f"GitHub sync is not enabled on Overleaf project {project_id}")
    commits = json.loads(
        _request(f"/project/{project_id}/github-sync/commits/unmerged", cookie)[1]
    ).get("commits", [])
    _request(
        f"/project/{project_id}/github-sync/merge",
        cookie,
        method="POST",
        body={"message": push_message} if push_message else {},
        csrf_token=csrf_token,
    )
    return {
        "project_id": project_id,
        "repo": sync_info.get("repo"),
        "action": "push" if push_message else "pull",
        "pulled_commits": [
            {
                "sha": c.get("sha", "")[:7],
                "message": (c.get("message") or "").splitlines()[0],
            }
            for c in commits
        ],
    }


def compile_project(
    cookie: str, project_id: str, csrf_token: str, download_pdf: Path | None = None
) -> dict[str, Any]:
    """Trigger an Overleaf compile and optionally download the compiled PDF.

    Args:
        cookie (str): `overleaf_session2=<value>` cookie header.
        project_id (str): 24-character Overleaf project ID.
        csrf_token (str): Overleaf CSRF token for the compile request.
        download_pdf (Path | None, optional): Local file path to save the compiled PDF.

    Returns:
        (dict[str, Any]): Compile status, page count, PDF size, timing, and optional output path.
    """
    _, body = _request(
        f"/project/{project_id}/compile",
        cookie,
        method="POST",
        body={
            "check": "silent",
            "draft": False,
            "incrementalCompilesEnabled": True,
            "stopOnFirstError": False,
        },
        csrf_token=csrf_token,
    )
    data = json.loads(body)
    files = {f["path"]: f for f in data.get("outputFiles", [])}
    query = f"?clsiserverid={data['clsiServerId']}" if data.get("clsiServerId") else ""

    pages = None
    if "output.log" in files:
        status, log = _request(
            files["output.log"]["url"] + query, cookie, accept="text/plain", check=False
        )
        match = re.search(
            r"Output written on [^\n]*\((\d+) pages?", log.decode(errors="replace")
        )
        pages = int(match.group(1)) if status == 200 and match else None

    saved_pdf = None
    if download_pdf and "output.pdf" in files:
        _, pdf = _request(
            files["output.pdf"]["url"] + query, cookie, accept="application/pdf"
        )
        saved_pdf = download_pdf.resolve()
        saved_pdf.parent.mkdir(parents=True, exist_ok=True)
        saved_pdf.write_bytes(pdf)

    stats = data.get("stats") or {}
    timings = data.get("timings") or {}
    return {
        "project_id": project_id,
        "status": data.get("status", "unknown"),
        "pages": pages,
        "pdf_size": files.get("output.pdf", {}).get("size") or stats.get("pdf-size"),
        "latexmk_errors": stats.get("latexmk-errors", 0),
        "compile_ms": timings.get("compileE2E") or timings.get("compile"),
        "pdf_path": str(saved_pdf) if saved_pdf else None,
    }


def fetch_reviews(
    cookie: str, project_id: str
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Fetch review threads and document comment ranges for one project.

    Args:
        cookie (str): `overleaf_session2=<value>` cookie header.
        project_id (str): 24-character Overleaf project ID.

    Returns:
        threads (dict[str, Any]): Review threads keyed by thread ID.
        ranges (list[dict[str, Any]]): Document range records containing comment anchors.
    """
    return (
        json.loads(_request(f"/project/{project_id}/threads", cookie)[1]),
        json.loads(_request(f"/project/{project_id}/ranges", cookie)[1]),
    )


def assemble(
    threads: dict[str, Any], ranges: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Flatten threads and ranges into one record per comment thread.

    Args:
        threads (dict[str, Any]): Review threads keyed by thread ID.
        ranges (list[dict[str, Any]]): Document range records containing comment anchors.

    Returns:
        (list[dict[str, Any]]): Assembled review thread records.
    """
    out = []
    for doc in ranges:
        for comment in (doc.get("ranges") or {}).get("comments", []):
            thread = threads.get(comment["id"], {})
            out.append(
                {
                    "thread_id": comment["id"],
                    "doc_id": doc["id"],
                    "snippet": comment["op"]["c"],
                    "offset": comment["op"]["p"],
                    "resolved": bool(thread.get("resolved_at")),
                    "messages": [
                        {
                            "user": (
                                (msg.get("user") or {}).get("first_name") or ""
                            ).strip(),
                            "ts": msg.get("timestamp"),
                            "content": msg.get("content", ""),
                        }
                        for msg in thread.get("messages", [])
                    ],
                }
            )
    return out


def find_snippet(repo: Path, snippet: str) -> tuple[str, int] | None:
    """Locate `snippet` in any `*.tex` file under `repo`.

    Args:
        repo (Path): Local LaTeX repository root.
        snippet (str): Highlighted comment text snippet.

    Returns:
        (tuple[str, int] | None): Relative file path and 1-based line number when matched.
    """
    needle = snippet.split("\n", 1)[0].strip()
    if not needle:
        return None
    for path in sorted(repo.rglob("*.tex")):
        text = path.read_text(errors="replace")
        idx = text.find(needle)
        if idx == -1:
            continue
        return str(path.relative_to(repo)), text[:idx].count("\n") + 1
    return None


def _print_report(report: list[dict[str, Any]], repo: Path, project_id: str) -> None:
    """Print human-readable review thread locations and messages.

    Args:
        report (list[dict[str, Any]]): Assembled review thread records.
        repo (Path): Local LaTeX repository root.
        project_id (str): 24-character Overleaf project ID.
    """
    print(f"# {len(report)} comment thread(s) for project {project_id}\n")
    for record in report:
        loc = find_snippet(repo, record["snippet"])
        loc_str = (
            f"{loc[0]}:{loc[1]}" if loc else f"<unmapped doc_id={record['doc_id']}>"
        )
        status = " (resolved)" if record["resolved"] else ""
        for msg in record["messages"]:
            print(f"{loc_str}{status}  [{msg['user']}]  {msg['content']}")
        print()


def _project_id(raw: str) -> str:
    """Return the 24-char hex project ID from a raw ID or an Overleaf project URL.

    Args:
        raw (str): Project ID or project URL.

    Returns:
        (str): 24-char hex project ID.
    """
    match = re.fullmatch(
        r"(?:https?://[^/]+/project/)?([0-9a-f]{24})(?:[/?#].*)?", raw.strip()
    )
    if not match:
        raise argparse.ArgumentTypeError(
            f"must be 24 hex chars or a project URL, got {raw!r}"
        )
    return match.group(1)


def main() -> None:
    """Dispatch CLI commands for auth, project listing, GitHub sync, compilation, and reviews."""
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument(
        "project_id",
        nargs="?",
        type=_project_id,
        help="24-char Overleaf project ID or project URL",
    )
    ap.add_argument("--repo", type=Path, default=Path.cwd())
    ap.add_argument("--json", action="store_true", help="emit JSON output")
    ap.add_argument(
        "--unresolved-only", action="store_true", help="filter out resolved threads"
    )
    ap.add_argument(
        "--check-auth",
        action="store_true",
        help="probe auth (refreshing from Chrome) and exit",
    )
    ap.add_argument(
        "--list-projects", action="store_true", help="list user projects and exit"
    )
    ap.add_argument(
        "--sync-github", action="store_true", help="pull GitHub commits into Overleaf"
    )
    ap.add_argument(
        "--push", metavar="MESSAGE", help="push Overleaf changes to GitHub with MESSAGE"
    )
    ap.add_argument(
        "--compile", action="store_true", help="trigger an Overleaf PDF compile"
    )
    ap.add_argument(
        "--download-pdf",
        type=Path,
        metavar="PATH",
        help="save the compiled PDF to PATH (implies --compile)",
    )
    args = ap.parse_args()
    args.sync_github |= bool(args.push)
    args.compile |= bool(args.download_pdf)
    if not (args.check_auth or args.list_projects or args.project_id):
        ap.error("project_id is required (or pass --check-auth / --list-projects)")

    cookie, email = load_cookie()
    if args.check_auth:
        print(f"OK {email}")
        return

    if args.list_projects:
        for proj in list_projects(cookie):
            print(
                f"{proj.get('_id', ''):24}  {proj.get('accessLevel', '?'):14}  {proj.get('name', '')}"
            )
        return

    if args.sync_github or args.compile:
        csrf = fetch_csrf_token(cookie, args.project_id)
        result: dict[str, Any] = {}
        if args.sync_github:
            result["sync"] = sync = sync_github(
                cookie, args.project_id, csrf, args.push
            )
            if not args.json:
                pulled = sync["pulled_commits"]
                print(
                    f"SYNC {sync['action']} {sync['repo']} ({f'{len(pulled)} commit(s)' if pulled else 'already up to date'})"
                )
                for commit in pulled:
                    print(f"  {commit['sha']}  {commit['message']}")
        if args.compile:
            result["compile"] = comp = compile_project(
                cookie, args.project_id, csrf, args.download_pdf
            )
            if not args.json:
                pages = f"{comp['pages']} pages, " if comp["pages"] is not None else ""
                size = f"{comp['pdf_size']} bytes, " if comp["pdf_size"] else ""
                pdf = f" -> {comp['pdf_path']}" if comp["pdf_path"] else ""
                print(
                    f"COMPILE {comp['status']} ({pages}{size}{comp['compile_ms']} ms, "
                    f"errors={comp['latexmk_errors']}){pdf}"
                )
        if args.json:
            print(json.dumps(result, indent=2, ensure_ascii=False))
        return

    threads, ranges = fetch_reviews(cookie, args.project_id)
    report = assemble(threads, ranges)
    if args.unresolved_only:
        report = [r for r in report if not r["resolved"]]
    repo = args.repo.resolve()
    if args.json:
        for record in report:
            loc = find_snippet(repo, record["snippet"])
            record["file"], record["line"] = loc or (None, None)
        print(json.dumps(report, indent=2, ensure_ascii=False))
        return
    _print_report(report, repo, args.project_id)


if __name__ == "__main__":
    main()
