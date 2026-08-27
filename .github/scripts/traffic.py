#!/usr/bin/env python3
"""Accumulate GitHub traffic counts into shields.io badge payloads."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def fetch(metric: str) -> dict[str, int]:
    """Return {date: count} for the 14 days of traffic the API still holds."""
    payload = subprocess.run(
        ["gh", "api", f"repos/{{owner}}/{{repo}}/traffic/{metric}"], capture_output=True, text=True, check=True
    ).stdout
    return {day["timestamp"][:10]: day["count"] for day in json.loads(payload)[metric]}


def badge(label: str, total: int) -> str:
    """Render a shields.io endpoint payload."""
    count = f"{total / 1000:.1f}k" if total >= 1000 else str(total)
    payload = {
        "schemaVersion": 1,
        "label": label,
        "message": count,
        "color": "e2603a",
    }
    return json.dumps(payload) + "\n"


data_dir = Path(sys.argv[1])
history_path = data_dir / "history.json"
history = json.loads(history_path.read_text()) if history_path.exists() else {}

# `uniques` is deduplicated per day and cannot be summed, so only `count` is carried.
# History is append-only because the API drops everything past 14 days.
for metric, label in (("clones", "Downloads"), ("views", "Views")):
    history[metric] = history.get(metric, {}) | fetch(metric)
    payload = badge(label, sum(history[metric].values()))
    (data_dir / f"{metric}.json").write_text(payload)
    print(payload.strip())

history_path.write_text(json.dumps(history, indent=2, sort_keys=True) + "\n")
