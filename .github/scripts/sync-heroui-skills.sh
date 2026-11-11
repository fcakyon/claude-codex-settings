#!/bin/bash
# Sync HeroUI v3 skills from a single upstream revision.
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

TARGET="$(mktemp -d)"
trap 'rm -rf "$TARGET"' EXIT
REV="$(gh api repos/heroui-inc/heroui/commits/v3 -q .sha)"
gh api "repos/heroui-inc/heroui/git/trees/$REV?recursive=1" \
  --jq '.tree[] | select(.type == "blob" and (.path | test("^skills/heroui-(react|migration|native)/"))) | .path' > "$TARGET/files"
xargs -P 4 -I '{}' bash -c '
  set -euo pipefail
  mkdir -p "$3/$(dirname "$1")"
  gh api "repos/heroui-inc/heroui/contents/$1?ref=$2" -q .content | base64 -d > "$3/$1"
' _ '{}' "$REV" "$TARGET" < "$TARGET/files"
for skill in heroui-react heroui-migration heroui-native; do
  sync_dir "$TARGET/skills/$skill" "plugins/heroui-skills/skills/$skill" .
  sed -i '/^# HeroUI/i\> Marketplace adaptation: installation and framework guidance follow the host project.\n' "$REPO_ROOT/plugins/heroui-skills/skills/$skill/SKILL.md"
  sed -i '/^## Installation$/,/^---$/c\## Installation\n\nThis skill is provided by the marketplace plugin. Install project dependencies using the host project package manager.\n\n---' "$REPO_ROOT/plugins/heroui-skills/skills/$skill/SKILL.md"
  if [ "$skill" = heroui-migration ]; then
    sed -i 's|https://heroui-git-docs-migration-heroui.vercel.app/docs/react/migration|https://heroui.com/en/docs/react/migration|g' "$REPO_ROOT/plugins/heroui-skills/skills/$skill/scripts/"*.mjs
    sed -i '/^## Preview Mode$/,$c\## Documentation source\n\nThe bundled scripts use the production migration documentation at https://heroui.com/en/docs/react/migration. Set HEROUI_MIGRATION_DOCS_BASE only when a different documentation deployment is required.' "$REPO_ROOT/plugins/heroui-skills/skills/$skill/SKILL.md"
  fi
  if [ "$skill" = heroui-react ]; then
    node - "$REPO_ROOT/plugins/heroui-skills/skills/$skill/SKILL.md" "$REPO_ROOT/.github/scripts/heroui-skills/vite-setup.md" <<'NODE'
const fs = require('node:fs');
const file = process.argv[2];
const source = fs.readFileSync(file, 'utf8');
const replacement = fs.readFileSync(process.argv[3], 'utf8') + '\n';
const updated = source.replace(/### Framework Setup \(Next\.js App Router - Recommended\)[\s\S]*?(?=### Critical Setup Requirements)/, replacement);
if (updated === source) throw new Error('HeroUI framework setup section changed upstream');
fs.writeFileSync(file, updated);
NODE
  fi
  create_zip "plugins/heroui-skills/skills/$skill"
done
echo "Done syncing heroui-skills at $REV."
