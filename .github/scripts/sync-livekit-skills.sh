#!/bin/bash
# Sync official LiveKit agent-skills into plugins/livekit-skills.
# Patches the Cloud-only framing so the skills also fit self-hosted LiveKit servers.
# Usage: bash .github/scripts/sync-livekit-skills.sh
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/livekit/agent-skills livekit-agent-skills
SRC="$HOME/dev/livekit-agent-skills/skills"
DST="plugins/livekit-skills/skills"

# Drop local skills that upstream removed or renamed
rm -rf "${REPO_ROOT:?}/$DST"
for dir in "$SRC"/*/; do
  sync_dir "${dir%/}" "$DST/$(basename "$dir")" .
done

python3 - "$REPO_ROOT/$DST" <<'PY'
import sys
from pathlib import Path

root = Path(sys.argv[1])
patches = {
    "building-livekit-agents": [
        ("Builds voice and chat AI agents with LiveKit Agents and LiveKit Cloud.",
         "Builds voice and chat AI agents with LiveKit Agents on LiveKit Cloud or a self-hosted server."),
        ("It assumes LiveKit Cloud, the recommended path: managed infrastructure, plus **LiveKit Inference**\n"
         "for models so you don't manage per-provider API keys.\n\n", ""),
    ],
    "operating-livekit-agents": [
        ("## Deploying to LiveKit Cloud\n\n",
         "## Deploying to LiveKit Cloud\n\n"
         "On a self-hosted LiveKit server the `lk agent` deploy commands do not apply. Ship the agent as a\n"
         "container or process under your own tooling (Docker, Kubernetes, systemd), keep secrets in its\n"
         "environment, and look up the server side with `lk docs get-page /home/self-hosting`. The worker,\n"
         "shutdown, and observability guidance below applies either way.\n\n"),
    ],
}
for skill, replacements in patches.items():
    path = root / skill / "SKILL.md"
    text = path.read_text()
    for old, new in replacements:
        if old not in text:
            print(f"WARNING: patch not found in {skill}: {old[:80]!r}", file=sys.stderr)
        text = text.replace(old, new, 1)
    path.write_text(text)
print("Patched LiveKit skills")
PY

for dir in "$REPO_ROOT/$DST"/*/; do
  create_zip "$DST/$(basename "$dir")"
done
