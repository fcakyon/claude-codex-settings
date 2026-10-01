#!/bin/bash
# Sync official Stripe agent-skills into plugins/stripe-skills.
# Skips stripe-pay (sends money) and stripe-directory (claims every vendor lookup before web search).
# Usage: bash .github/scripts/sync-stripe-skills.sh
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/stripe/ai stripe-ai
SRC="$HOME/dev/stripe-ai/skills"

for dir in "$SRC"/*/; do
  skill="$(basename "$dir")"
  case "$skill" in stripe-pay | stripe-directory) continue ;; esac
  sync_skill "${dir%/}" "plugins/stripe-skills/skills/$skill" MIT
done

echo "Done syncing stripe-skills."
