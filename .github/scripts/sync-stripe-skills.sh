#!/bin/bash
# Sync official Stripe agent-skills into plugins/stripe-skills.
# Usage: bash .github/scripts/sync-stripe-skills.sh
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/stripe/ai stripe-ai
SRC="$HOME/dev/stripe-ai/skills"

sync_dir "$SRC/stripe-best-practices" "plugins/stripe-skills/skills/stripe-best-practices" "SKILL.md" "references/"
sync_dir "$SRC/stripe-projects" "plugins/stripe-skills/skills/stripe-projects" "SKILL.md"
sync_dir "$SRC/upgrade-stripe" "plugins/stripe-skills/skills/upgrade-stripe" "SKILL.md"

for skill in stripe-best-practices stripe-projects upgrade-stripe; do
  ensure_license "plugins/stripe-skills/skills/$skill" MIT
  create_zip "plugins/stripe-skills/skills/$skill"
done

echo "Done syncing stripe-skills."
