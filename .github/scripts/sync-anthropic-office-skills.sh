#!/bin/bash
# Sync official Anthropic office skills into plugins/anthropic-office-skills.
# Usage: bash .github/scripts/sync-anthropic-office-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/anthropics/skills anthropic-skills

SRC="$HOME/dev/anthropic-skills/skills"

# pdf (has extra md files: forms.md, reference.md)
sync_dir "$SRC/pdf" \
  "plugins/anthropic-office-skills/skills/pdf" \
  "SKILL.md" "scripts/" "forms.md" "reference.md" "LICENSE.txt"
ensure_license "plugins/anthropic-office-skills/skills/pdf" MIT
create_zip "plugins/anthropic-office-skills/skills/pdf"

# pptx (has extra md files: editing.md, pptxgenjs.md)
sync_dir "$SRC/pptx" \
  "plugins/anthropic-office-skills/skills/pptx" \
  "SKILL.md" "scripts/" "editing.md" "pptxgenjs.md" "LICENSE.txt"
ensure_license "plugins/anthropic-office-skills/skills/pptx" MIT
create_zip "plugins/anthropic-office-skills/skills/pptx"

# xlsx
sync_dir "$SRC/xlsx" \
  "plugins/anthropic-office-skills/skills/xlsx" \
  "SKILL.md" "scripts/" "LICENSE.txt"
ensure_license "plugins/anthropic-office-skills/skills/xlsx" MIT
create_zip "plugins/anthropic-office-skills/skills/xlsx"

# docx
sync_dir "$SRC/docx" \
  "plugins/anthropic-office-skills/skills/docx" \
  "SKILL.md" "scripts/" "LICENSE.txt"
ensure_license "plugins/anthropic-office-skills/skills/docx" MIT
create_zip "plugins/anthropic-office-skills/skills/docx"

echo "Done syncing anthropic-office-skills."
