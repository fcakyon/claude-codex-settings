#!/bin/bash
# Sync official OpenAI office skills into plugins/openai-office-skills.
# Usage: bash .github/scripts/sync-openai-office-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/openai/skills openai-skills

SRC="$HOME/dev/openai-skills/skills/.curated"

# pdf
sync_dir "$SRC/pdf" \
  "plugins/openai-office-skills/skills/pdf" \
  "SKILL.md" "LICENSE.txt"
ensure_license "plugins/openai-office-skills/skills/pdf" MIT
create_zip "plugins/openai-office-skills/skills/pdf"

# slides (has references/, scripts/, assets/pptxgenjs_helpers/)
sync_dir "$SRC/slides" \
  "plugins/openai-office-skills/skills/slides" \
  "SKILL.md" "references/" "scripts/" "assets/" "LICENSE.txt"
# Remove platform icons, keep only pptxgenjs_helpers used by the skill
rm -f "$REPO_ROOT/plugins/openai-office-skills/skills/slides/assets/"*.png \
  "$REPO_ROOT/plugins/openai-office-skills/skills/slides/assets/"*.svg
ensure_license "plugins/openai-office-skills/skills/slides" MIT
create_zip "plugins/openai-office-skills/skills/slides"

# spreadsheet (has references/)
sync_dir "$SRC/spreadsheet" \
  "plugins/openai-office-skills/skills/spreadsheet" \
  "SKILL.md" "references/" "LICENSE.txt"
ensure_license "plugins/openai-office-skills/skills/spreadsheet" MIT
create_zip "plugins/openai-office-skills/skills/spreadsheet"

# doc (has scripts/)
sync_dir "$SRC/doc" \
  "plugins/openai-office-skills/skills/doc" \
  "SKILL.md" "scripts/" "LICENSE.txt"
ensure_license "plugins/openai-office-skills/skills/doc" MIT
create_zip "plugins/openai-office-skills/skills/doc"

echo "Done syncing openai-office-skills."
