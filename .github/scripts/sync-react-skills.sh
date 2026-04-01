#!/bin/bash
# Sync react and frontend skills into plugins/react-skills.
# Usage: bash .github/scripts/sync-react-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/vercel-labs/agent-skills vercel-agent-skills

SRC="$HOME/dev/vercel-agent-skills/skills"

RULES_SKILLS=(composition-patterns react-best-practices react-native-skills)
for skill in "${RULES_SKILLS[@]}"; do
  sync_dir "$SRC/$skill" "plugins/react-skills/skills/$skill" "SKILL.md" "rules/"
  ensure_license "plugins/react-skills/skills/$skill" MIT
  create_zip "plugins/react-skills/skills/$skill"
done

sync_dir "$SRC/react-view-transitions" "plugins/react-skills/skills/react-view-transitions" "SKILL.md" "references/"
ensure_license "plugins/react-skills/skills/react-view-transitions" MIT
create_zip "plugins/react-skills/skills/react-view-transitions"

sync_dir "$SRC/web-design-guidelines" "plugins/react-skills/skills/web-design-guidelines" "SKILL.md"
ensure_license "plugins/react-skills/skills/web-design-guidelines" MIT

# Download guidelines content as a local reference and replace the remote URL in SKILL.md.
WDG_DIR="$REPO_ROOT/plugins/react-skills/skills/web-design-guidelines"
mkdir -p "$WDG_DIR/references"
curl -fsSL "https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md" \
  -o "$WDG_DIR/references/web-interface-guidelines.md"
sed -i '' 's|https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md|references/web-interface-guidelines.md|g' \
  "$WDG_DIR/SKILL.md"

create_zip "plugins/react-skills/skills/web-design-guidelines"

echo "Done syncing react-skills."
