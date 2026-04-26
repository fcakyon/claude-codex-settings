#!/usr/bin/env python3
"""UserPromptSubmit hook: detect tool rejection in prior turn and ship categorized feedback.

When the user rejects a tool call, Claude Code records it in the transcript and prompts
the user to explain. Their explanation arrives as the NEXT user prompt. This hook reads
the transcript backward, finds the most recent rejected tool, classifies the user's
prompt into a reject category, and posts a `reject_feedback` log event so the dashboard
panel can show *why* tools get rejected, not just that they do.
"""

import hashlib
import json
import os
import re
import socket
import sys
import time
import urllib.request
from pathlib import Path

CATEGORIES = [
    ("profanity", re.compile(r"\b(fuck(?:ed|ing)?|shit|wtf|bullshit|dumb|idiot|stupid)\b|fuck'?s sake", re.I)),
    (
        "factual_challenge",
        re.compile(
            r"\b(you (said|did|claimed|fucked|forgot|lied|missed)|lying|hallucin|made up|no such|doesn'?t exist)\b|wtf\?",
            re.I,
        ),
    ),
    ("terse_reject", re.compile(r"^(no|nope|stop|halt|wrong|revert|undo|nah)[!.\s]?$|^no[ ,!]", re.I)),
    (
        "wrong_target",
        re.compile(
            r"\b(i meant|wrong (file|place|repo|branch|machine|directory)|not that|not the|same (file|place|location))\b|^no,? i\b",
            re.I,
        ),
    ),
    (
        "tool_steering",
        re.compile(
            r"\b(use|just use|stick to|prefer)\b.*\b(rg|grep|gh|tavily|mcp|slack|bun|uv|pytest|jq)\b|\binstead of\b",
            re.I,
        ),
    ),
    (
        "scope_drift",
        re.compile(
            r"\b(without breaking|only (do|fix|change|the)|don'?t (touch|change|modify|add|create|put|run)|overengin|bloated|no need (to|for))\b",
            re.I,
        ),
    ),
    (
        "verify_first",
        re.compile(
            r"\b(check (first|docs|code|source|the)|have you (checked|read|verified)|read (the )?(code|docs|source)|move with evidence)\b",
            re.I,
        ),
    ),
    ("rule_setting", re.compile(r"\b(never|always|from now|next time|remember to)\b", re.I)),
    (
        "why_rhetorical",
        re.compile(r"\bwhy (the |are you|did you|don'?t? you|is (it|cladue|claude)|not|no)\b|\?$", re.I),
    ),
    ("retry_request", re.compile(r"\b(try again|again|once more|redo|retry)\b", re.I)),
]


def project_hash(cwd: str) -> str:
    return hashlib.sha256(cwd.encode()).hexdigest()[:12]


def host_name() -> str:
    """Read host.name from OTEL_RESOURCE_ATTRIBUTES so the hook matches Claude Code's friendly name."""
    for pair in os.environ.get("OTEL_RESOURCE_ATTRIBUTES", "").split(","):
        k, _, v = pair.partition("=")
        if k.strip() == "host.name" and v.strip():
            return v.strip()
    return socket.gethostname()


def load_chat_id(cwd: str) -> str:
    f = Path.home() / ".claude" / "state" / f"chat_id_{project_hash(cwd)}"
    return f.read_text().strip() if f.exists() else ""


def categorize(prompt: str) -> str:
    for name, pat in CATEGORIES:
        if pat.search(prompt):
            return name
    return "uncategorized"


def find_recent_reject(transcript_path: str) -> dict | None:
    """Walk transcript backward to find the most recent tool_decision=reject within last N entries."""
    p = Path(transcript_path)
    if not p.exists():
        return None
    lines = p.read_text().splitlines()
    for line in reversed(lines[-30:]):
        try:
            entry = json.loads(line)
        except Exception:
            continue
        msg = entry.get("message", entry)
        content = msg.get("content")
        tur = entry.get("toolUseResult")
        tur = tur if isinstance(tur, dict) else {}
        if isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "tool_result" and block.get("is_error"):
                    return {"tool_name": tur.get("name", "")}
        if tur.get("interrupted"):
            return {"tool_name": tur.get("name", "")}
    return None


def parse_otlp_headers(raw: str) -> dict:
    headers = {}
    for pair in (raw or "").split(","):
        if "=" in pair:
            k, v = pair.split("=", 1)
            headers[k.strip()] = v.strip()
    return headers


def emit_log(event: dict) -> None:
    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not endpoint:
        return
    headers = parse_otlp_headers(os.environ.get("OTEL_EXPORTER_OTLP_HEADERS", ""))
    stream = headers.get("stream-name", "claude-code").replace("-", "_")
    url = f"{endpoint.rstrip('/')}/{stream}/_json"
    req = urllib.request.Request(url, data=json.dumps([event]).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    if "Authorization" in headers:
        req.add_header("Authorization", headers["Authorization"])
    try:
        urllib.request.urlopen(req, timeout=3).read()
    except Exception:
        pass


def main() -> None:
    payload = json.loads(sys.stdin.read() or "{}")
    prompt = payload.get("prompt", "")
    transcript_path = payload.get("transcript_path", "")
    if not prompt or not transcript_path:
        return
    reject = find_recent_reject(transcript_path)
    if not reject:
        return
    cwd = payload.get("cwd") or os.getcwd()
    event = {
        "_timestamp": int(time.time() * 1_000_000),
        "event_name": "reject_feedback",
        "session_id": payload.get("session_id", ""),
        "chat_id": load_chat_id(cwd),
        "tool_name": reject.get("tool_name", "unknown"),
        "reject_category": categorize(prompt),
        "feedback_excerpt": prompt[:200],
        "host_name": host_name(),
    }
    emit_log(event)


if __name__ == "__main__":
    main()
