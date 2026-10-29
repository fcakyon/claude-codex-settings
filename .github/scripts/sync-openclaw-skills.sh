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

fetch() { gh api "repos/$UPSTREAM/contents/$1?ref=$SHA" --jq .content | base64 -d > "$STAGING/$2"; }
mkdir "$STAGING/references"
fetch .agents/skills/test-audit/SKILL.md SKILL.md
fetch .agents/skills/test-audit/CAMPAIGN.md references/campaign.md
fetch .agents/skills/test-audit/references/audit.md references/audit.md
fetch LICENSE LICENSE

python3 - "$STAGING" <<'PY'
import re
import sys
from pathlib import Path

staging = Path(sys.argv[1])
campaign = staging / "references/campaign.md"
if campaign.read_text().count("](SKILL.md)") != 2:
    raise SystemExit("Upstream changed, SKILL.md links in CAMPAIGN.md")
campaign.write_text(campaign.read_text().replace("](SKILL.md)", "](../SKILL.md)"))
path = staging / "SKILL.md"
text = path.read_text()
replacements = {
    r'^description: .*$': 'description: This skill should be used when the user asks to "write a test", "review these tests", "audit tests", "prune low-value tests", or "find duplicate tests", and whenever writing, changing, reviewing, or sweeping tests. Gates new tests and audits low-value, implementation-coupled, or duplicative tests and the test-only production seams they demand.',
    r'Use \[boundary and cost guide\]\(../../../docs/help/testing/writing-tests.md\)\.':
        'Use the repository testing guide for boundary and cost decisions.',
    r'Follow \[proof policy\]\(../openclaw-testing/SKILL.md#proof-policy\); preserve active\n  Vitest checkouts; run owner/sibling proof \+ changed checks; then autoreview\.':
        'Follow the repository testing guide; preserve active test checkouts;\n  run owner and sibling tests plus required checks, then review the full diff.',
    r'read \[CAMPAIGN\.md\]\(CAMPAIGN\.md\)': 'read [references/campaign.md](references/campaign.md)',
}
for pattern, replacement in replacements.items():
    text, count = re.subn(pattern, lambda _: replacement, text, flags=re.M)
    if count != 1:
        raise SystemExit(f"Upstream changed, pattern not found: {pattern}")
if leftover := re.findall(r"\$openclaw|\$crabbox|\$autoreview|scripts/\S+\.mjs|Vitest", text):
    raise SystemExit(f"Unadapted OpenClaw references: {leftover}")
path.write_text(text)
path = staging / "references/audit.md"
text = path.read_text().replace("](../CAMPAIGN.md)", "](campaign.md)")
text = text.replace(
    "- Follow [proof policy](../../openclaw-testing/SKILL.md#proof-policy).\n"
    "  Never edit checkout during active Vitest run. Run owner/sibling tests.",
    "- Follow the repository testing guide.\n"
    "  Never edit a checkout during an active test run. Run owner and sibling tests.",
).replace(
    "- Run targeted format, `git diff --check`; classify changed gate with\n"
    "  `node scripts/check-changed.mjs --dry-run -- <changed-paths>` before running it.",
    "- Run targeted formatting, `git diff --check`, and required changed-file checks.",
).replace(
    "- Before landing removal batches, run CI's `pnpm deadcode:dependencies`,\n"
    "  `pnpm deadcode:unused-files`, and `pnpm deadcode:exports` (all phases): removed\n"
    "  tests orphan support files/exports that ordinary PR CI misses and main's\n"
    "  `check-dependencies` catches.",
    "- Before landing removal batches, run the repository's unused dependency, file,\n"
    "  and export checks when available. Removed tests can orphan support code.",
).replace("get final autoreview", "review the full diff")
if leftover := re.findall(r"openclaw-testing|scripts/\S+\.mjs|Vitest|pnpm deadcode:", text):
    raise SystemExit(f"Unadapted OpenClaw audit references: {leftover}")
path.write_text(text)
PY

sync_dir "$STAGING" "$TARGET" SKILL.md references/ LICENSE
create_zip "$TARGET"
echo "Done syncing test-audit from $UPSTREAM@$SHA."
