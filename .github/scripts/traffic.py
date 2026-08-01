#!/usr/bin/env python3
"""Accumulate GitHub traffic counts into rolling 30-day shields.io badge payloads."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

WINDOW_DAYS = 30


def fetch(metric: str) -> dict[str, int]:
    """Return {date: count} for the 14 days of traffic the API still holds."""
    payload = subprocess.run(
        ["gh", "api", f"repos/{{owner}}/{{repo}}/traffic/{metric}"], capture_output=True, text=True, check=True
    ).stdout
    return {day["timestamp"][:10]: day["count"] for day in json.loads(payload)[metric]}


def badge(label: str, total: int, collected: int) -> str:
    """Render a shields.io endpoint payload, naming the real window until a month has accrued."""
    count = f"{total / 1000:.1f}k" if total >= 1000 else str(total)
    period = "month" if collected >= WINDOW_DAYS else f"{collected}d"
    payload = {
        "schemaVersion": 1,
        "label": label.capitalize(),
        "message": f"{count}/{period}",
        "color": "e2603a",
    }
    return json.dumps(payload) + "\n"


data_dir = Path(sys.argv[1])
history_path = data_dir / "history.json"
history = json.loads(history_path.read_text()) if history_path.exists() else {}
cutoff = str(date.today() - timedelta(days=WINDOW_DAYS))

# `uniques` is deduplicated per day and cannot be summed, so only `count` is carried.
# History is append-only because the API drops everything past 14 days, which makes this
# file the only lasting record, so the 30-day window is applied at render time.
for metric in ("clones", "views"):
    history[metric] = history.get(metric, {}) | fetch(metric)
    total = sum(count for day, count in history[metric].items() if day > cutoff)
    collected = (date.today() - date.fromisoformat(min(history[metric]))).days
    payload = badge(metric, total, collected)
    (data_dir / f"{metric}.json").write_text(payload)
    print(payload.strip())

history_path.write_text(json.dumps(history, indent=2, sort_keys=True) + "\n")
