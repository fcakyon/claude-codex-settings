#!/bin/bash
# Sync official OpenAI office skills into plugins/openai-office-skills.
# Usage: bash .github/scripts/sync-openai-office-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/openai/skills openai-skills

SRC="$HOME/dev/openai-skills/skills/.curated"

# slides and spreadsheet are vendored locally (upstream removed them in openai/skills#350).

# pdf
sync_dir "$SRC/pdf" \
  "plugins/openai-office-skills/skills/pdf" \
  "SKILL.md" "LICENSE.txt"
ensure_license "plugins/openai-office-skills/skills/pdf" MIT
create_zip "plugins/openai-office-skills/skills/pdf"

# doc (has scripts/)
sync_dir "$SRC/doc" \
  "plugins/openai-office-skills/skills/doc" \
  "SKILL.md" "scripts/" "LICENSE.txt"
ensure_license "plugins/openai-office-skills/skills/doc" MIT
create_zip "plugins/openai-office-skills/skills/doc"

echo "Done syncing openai-office-skills."
