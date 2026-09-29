#!/bin/bash
# Sync the OpenClaw test-audit skill into plugins/test-audit.
# Upstream steps that call OpenClaw-only scripts and skills are rewritten for any repo.
# Usage: bash .github/scripts/sync-openclaw-skills.sh [ref]
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

UPSTREAM=openclaw/openclaw
SHA="$(gh api "repos/$UPSTREAM/commits/${1:-main}" --jq .sha)"
TARGET=plugins/test-audit/skills/test-audit
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

for file in .agents/skills/test-audit/SKILL.md .agents/skills/test-audit/CAMPAIGN.md LICENSE; do
  gh api "repos/$UPSTREAM/contents/$file?ref=$SHA" --jq .content | base64 -d > "$STAGING/$(basename "$file")"
done

python3 - "$STAGING/SKILL.md" <<'PY'
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()
replacements = {
    r'^description: .*$': 'description: This skill should be used when the user asks to "write a test", "review these tests", "audit tests", "prune low-value tests", or "find duplicate tests", and whenever writing, changing, reviewing, or sweeping tests. Gates new tests and audits low-value, implementation-coupled, or duplicative tests and the test-only production seams they demand.',
    r'- core and packages \(`src/`, `packages/`\);\n- plugins \(`extensions/`\);\n': '- core source and packages;\n- plugins or extensions;\n',
    r'Never edit source or tests while Vitest is running in the checkout\. Follow\n`\$openclaw-testing`; route heavy proof through its `\$crabbox` rules\.':
        'Never edit source or tests while a test watcher is running in the checkout.\nFollow the repository testing guide when one exists.',
    r'1\. Run the smallest owner and sibling tests with\n   `node scripts/run-vitest\.mjs <path-or-filter>`\.':
        "1. Run the smallest owner and sibling tests with the project's test runner.",
    r'4\. Classify with\n   `node scripts/check-changed\.mjs --dry-run -- <changed-paths>`, then run the\n   actual changed gate required by repository policy\.':
        '4. Run the changed-file or CI gate required by repository policy.',
    r'6\. After final audit edits, run mandatory `\$autoreview`\.': '6. After final audit edits, run a code review of the full diff.',
    r' Use\n`\$openclaw-pr-maintainer` and the repository `scripts/pr` flow\.': '',
}
for pattern, replacement in replacements.items():
    text, count = re.subn(pattern, lambda _: replacement, text, flags=re.M)
    if count != 1:
        raise SystemExit(f"Upstream changed, pattern not found: {pattern}")
if leftover := re.findall(r"\$openclaw|\$crabbox|\$autoreview|scripts/\S+\.mjs|Vitest", text):
    raise SystemExit(f"Unadapted OpenClaw references: {leftover}")
path.write_text(text)
PY

sync_dir "$STAGING" "$TARGET" SKILL.md CAMPAIGN.md LICENSE
create_zip "$TARGET"
echo "Done syncing test-audit from $UPSTREAM@$SHA."
