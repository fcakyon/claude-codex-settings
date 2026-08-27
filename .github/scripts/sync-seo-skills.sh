#!/bin/bash
# Sync SEO skills from Vercel Labs into plugins/seo-skills.
# Usage: bash .github/scripts/sync-seo-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/vercel-labs/marketing-team-eve-template vercel-marketing-team-eve-template

SRC="$HOME/dev/vercel-marketing-team-eve-template/agent/subagents/seo/skills"
SKILLS=(seo-audit programmatic-seo schema site-architecture)

for skill in "${SKILLS[@]}"; do
  sync_dir "$SRC/$skill" "plugins/seo-skills/skills/$skill" "SKILL.md" "references/"
  skill_md="$REPO_ROOT/plugins/seo-skills/skills/$skill/SKILL.md"
  if ! rg -q '^name:' "$skill_md"; then
    sed -i '' "1a\\
name: $skill
" "$skill_md"
  fi
  ensure_license "plugins/seo-skills/skills/$skill" MIT
done

SCHEMA_DIR="$REPO_ROOT/plugins/seo-skills/skills/schema"
sed -i '' \
  's/the form `validate_schema` reads/the form the bundled validator reads/' \
  "$SCHEMA_DIR/SKILL.md"
sed -i '' \
  's/Run `validate_schema` on any block before you hand it over\./From this skill directory, run `node scripts\/validate_schema.mjs <jsonld-file>` on any block before you hand it over./' \
  "$SCHEMA_DIR/SKILL.md"

mkdir -p "$SCHEMA_DIR/scripts"
cp "$REPO_ROOT/.github/scripts/seo-skills/validate_schema.mjs" "$SCHEMA_DIR/scripts/"
chmod +x "$SCHEMA_DIR/scripts/validate_schema.mjs"

for skill in "${SKILLS[@]}"; do
  create_zip "plugins/seo-skills/skills/$skill"
done

echo "Done syncing seo-skills."
