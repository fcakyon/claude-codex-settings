#!/usr/bin/env python3
"""Fetch Overleaf review comments for a project and map them to local file:line.

Usage:
    python3 overleaf_reviews.py <project_id> [--repo .] [--json] [--unresolved-only]
    python3 overleaf_reviews.py --check-auth
    python3 overleaf_reviews.py --list-projects

Auth: reads the Overleaf session cookie from (in order):
    1. OVERLEAF_COOKIE env var
    2. ~/.claude/overleaf-skills/cookie file (chmod 600, written by setup skill)

Cookie name on current Overleaf is `overleaf_session2` (underscore). The legacy
`overleaf.session2` (dot) name no longer authenticates. Sessions slide ~5 days
idle, refresh on use.

Each comment is anchored to its highlighted snippet (`op.c` field of the range);
the script locates that snippet in *.tex files under the repo root.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

OVERLEAF_BASE = "https://www.overleaf.com"
COOKIE_FILE = Path.home() / ".claude" / "overleaf-skills" / "cookie"
CHROME_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

REFRESH_HINT = (
    "\nOverleaf session missing or expired. To refresh:\n"
    "  Ask Claude to 'set up overleaf' (triggers the overleaf-skills setup skill),\n"
    "  or manually:\n"
    "    1. Open https://www.overleaf.com in Chrome (logged in).\n"
    "    2. DevTools -> Application -> Cookies -> www.overleaf.com.\n"
    "    3. Find row with Name = 'overleaf_session2' (UNDERSCORE, not dot).\n"
    "    4. Copy the Value. Save to ~/.claude/overleaf-skills/cookie as:\n"
    "         overleaf_session2=<paste value>\n"
    "    5. chmod 600 ~/.claude/overleaf-skills/cookie\n"
    "Sessions slide ~5 days idle.\n"
)


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Block redirects so 302 -> /login surfaces as 302, not silent HTML."""

    def http_error_302(self, req, fp, code, msg, headers):
        return fp

    http_error_301 = http_error_303 = http_error_307 = http_error_302


def load_cookie() -> str:
    """Return the normalized `overleaf_session2=<value>` cookie pair, or exit with refresh hint."""
    raw = os.environ.get("OVERLEAF_COOKIE")
    if not raw and COOKIE_FILE.exists():
        raw = COOKIE_FILE.read_text().strip()
    if not raw:
        sys.exit(REFRESH_HINT)
    raw = raw.strip()
    if not raw.startswith("overleaf_session2="):
        if raw.startswith("overleaf.session2="):
            sys.exit(
                "Cookie name `overleaf.session2` (dot) no longer exists on Overleaf.\n"
                "Re-grab the row named `overleaf_session2` (underscore)." + REFRESH_HINT
            )
        raw = "overleaf_session2=" + raw
    return raw


def _opener():
    """Build a urllib opener that does not follow redirects."""
    return urllib.request.build_opener(_NoRedirect)


def _request(path: str, cookie: str):
    """Issue a GET against Overleaf with the session cookie. Returns (status, content_type, body_bytes)."""
    req = urllib.request.Request(
        OVERLEAF_BASE + path,
        headers={
            "Cookie": cookie,
            "Accept": "application/json",
            "User-Agent": CHROME_UA,
        },
    )
    try:
        r = _opener().open(req)
        return r.status, r.headers.get("content-type") or "", r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("content-type") or "", e.read()


def check_auth(cookie: str) -> tuple[bool, str]:
    """Hit /user/personal_info and return (ok, email-or-error)."""
    status, _, body = _request("/user/personal_info", cookie)
    if status != 200:
        return False, f"status={status}"
    try:
        data = json.loads(body)
        return True, data.get("email", "<unknown>")
    except json.JSONDecodeError:
        return False, "non-json response"


def list_projects(cookie: str) -> list[dict]:
    """Return a sorted list of {_id, name, accessLevel} dicts."""
    status, _, body = _request("/user/projects", cookie)
    if status != 200:
        sys.exit(REFRESH_HINT if status == 401 else f"/user/projects failed: status={status}")
    data = json.loads(body)
    projects = data.get("projects", []) if isinstance(data, dict) else []
    return sorted(projects, key=lambda p: (p.get("name") or "").lower())


def fetch_reviews(cookie: str, project_id: str) -> tuple[dict, list]:
    """Fetch (threads_by_id, ranges_by_doc) for one project. Exit on 401."""
    s1, _, b1 = _request(f"/project/{project_id}/threads", cookie)
    s2, _, b2 = _request(f"/project/{project_id}/ranges", cookie)
    if s1 == 401 or s2 == 401:
        sys.exit(REFRESH_HINT)
    if s1 != 200:
        sys.exit(f"/threads failed: status={s1}")
    if s2 != 200:
        sys.exit(f"/ranges failed: status={s2}")
    return json.loads(b1), json.loads(b2)


def assemble(threads: dict, ranges: list) -> list[dict]:
    """Flatten threads + ranges into one record per comment thread with messages and snippet."""
    out = []
    for doc in ranges:
        for c in (doc.get("ranges") or {}).get("comments", []):
            t = threads.get(c["id"], {})
            out.append(
                {
                    "thread_id": c["id"],
                    "doc_id": doc["id"],
                    "snippet": c["op"]["c"],
                    "offset": c["op"]["p"],
                    "resolved": bool(t.get("resolved_at")),
                    "messages": [
                        {
                            "user": ((m.get("user") or {}).get("first_name") or "").strip(),
                            "ts": m.get("timestamp"),
                            "content": m.get("content", ""),
                        }
                        for m in t.get("messages", [])
                    ],
                }
            )
    return out


def find_snippet(repo: Path, snippet: str) -> tuple[str, int] | None:
    """Locate `snippet` in any *.tex file under repo. Returns (relpath, 1-based line)."""
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


def _print_report(report: list[dict], repo: Path, project_id: str) -> None:
    print(f"# {len(report)} comment thread(s) for project {project_id}\n")
    for r in report:
        loc = find_snippet(repo, r["snippet"])
        loc_str = f"{loc[0]}:{loc[1]}" if loc else f"<unmapped doc_id={r['doc_id']}>"
        status = " (resolved)" if r["resolved"] else ""
        for m in r["messages"]:
            print(f"{loc_str}{status}  [{m['user']}]  {m['content']}")
        print()


def main() -> None:
    """Dispatch CLI subcommands: --check-auth, --list-projects, or fetch-by-project-id."""
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("project_id", nargs="?", help="24-char Overleaf project ID")
    ap.add_argument("--repo", type=Path, default=Path.cwd())
    ap.add_argument("--json", action="store_true", help="emit raw JSON instead of mapped report")
    ap.add_argument("--unresolved-only", action="store_true", help="filter out resolved threads")
    ap.add_argument("--check-auth", action="store_true", help="probe auth and exit")
    ap.add_argument("--list-projects", action="store_true", help="list user projects and exit")
    args = ap.parse_args()

    cookie = load_cookie()

    if args.check_auth:
        ok, info = check_auth(cookie)
        print(f"OK {info}" if ok else f"FAIL {info}")
        sys.exit(0 if ok else 1)

    if args.list_projects:
        for p in list_projects(cookie):
            print(f"{p.get('_id', ''):24}  {p.get('accessLevel', '?'):14}  {p.get('name', '')}")
        return

    if not args.project_id:
        ap.error("project_id is required (or pass --check-auth / --list-projects)")
    if not re.fullmatch(r"[0-9a-f]{24}", args.project_id):
        ap.error(f"invalid project_id: must be 24 hex chars, got {args.project_id!r}")

    threads, ranges = fetch_reviews(cookie, args.project_id)
    report = assemble(threads, ranges)
    if args.unresolved_only:
        report = [r for r in report if not r["resolved"]]

    if args.json:
        # Annotate with mapped location so callers don't need to repeat find_snippet.
        repo = args.repo.resolve()
        for r in report:
            loc = find_snippet(repo, r["snippet"])
            r["file"], r["line"] = (loc[0], loc[1]) if loc else (None, None)
        json.dump(report, sys.stdout, indent=2, ensure_ascii=False)
        sys.stdout.write("\n")
        return

    _print_report(report, args.repo.resolve(), args.project_id)


if __name__ == "__main__":
    main()
