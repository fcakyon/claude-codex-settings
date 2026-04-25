#!/usr/bin/env python3
"""SessionStart hook: emit sticky chat_id so resumed/related sessions group together.

Reads `~/.claude/state/chat_id_<project_hash>` if present, else mints a new UUID
and writes it. Posts a `session_link` log event to the OTel logs endpoint already
configured for Claude Code (OTEL_EXPORTER_OTLP_ENDPOINT + OTEL_EXPORTER_OTLP_HEADERS).

The chat_id stays the same as long as the user is working in the same project
directory. To start a new chat, delete the state file or set CLAUDE_NEW_CHAT=1.
"""

import hashlib
import json
import os
import socket
import sys
import time
import urllib.request
import uuid
from pathlib import Path


def host_name() -> str:
    """Read host.name from OTEL_RESOURCE_ATTRIBUTES so the hook matches Claude Code's friendly name."""
    for pair in os.environ.get("OTEL_RESOURCE_ATTRIBUTES", "").split(","):
        k, _, v = pair.partition("=")
        if k.strip() == "host.name" and v.strip():
            return v.strip()
    return socket.gethostname()


def project_hash(cwd: str) -> str:
    return hashlib.sha256(cwd.encode()).hexdigest()[:12]


def chat_id_for(cwd: str) -> tuple[str, str]:
    state_dir = Path.home() / ".claude" / "state"
    state_dir.mkdir(parents=True, exist_ok=True)
    state_file = state_dir / f"chat_id_{project_hash(cwd)}"
    if os.environ.get("CLAUDE_NEW_CHAT") == "1" or not state_file.exists():
        cid = str(uuid.uuid4())
        state_file.write_text(cid)
        return cid, "created"
    return state_file.read_text().strip(), "reused"


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
    raw_headers = os.environ.get("OTEL_EXPORTER_OTLP_HEADERS", "")
    headers = parse_otlp_headers(raw_headers)
    stream = headers.get("stream-name", "claude-code").replace("-", "_")
    org_endpoint = endpoint.rstrip("/")
    url = f"{org_endpoint}/{stream}/_json"
    body = json.dumps([event]).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    if "Authorization" in headers:
        req.add_header("Authorization", headers["Authorization"])
    try:
        urllib.request.urlopen(req, timeout=3).read()
    except Exception:
        pass


def main() -> None:
    payload = json.loads(sys.stdin.read() or "{}")
    cwd = payload.get("cwd") or os.getcwd()
    cid, action = chat_id_for(cwd)
    event = {
        "_timestamp": int(time.time() * 1_000_000),
        "event_name": "session_link",
        "session_id": payload.get("session_id", ""),
        "chat_id": cid,
        "chat_action": action,
        "source": payload.get("source", ""),
        "host_name": host_name(),
        "cwd": cwd,
        "project_hash": project_hash(cwd),
    }
    emit_log(event)
    print(json.dumps({"chat_id": cid}))


if __name__ == "__main__":
    main()
