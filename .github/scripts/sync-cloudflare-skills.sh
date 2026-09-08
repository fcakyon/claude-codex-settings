#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/cloudflare/skills cloudflare-skills
SRC="$HOME/dev/cloudflare-skills/skills"

for source_dir in "$SRC"/*; do
  skill="$(basename "$source_dir")"
  target="plugins/cloudflare-skills/skills/$skill"
  if [ "$skill" = cloudflare ]; then
    target="plugins/cloudflare-skills/skills/cloudflare-deploy"
  fi
  sync_dir "$source_dir" "$target" .
  sed -i '' 's/^name: cloudflare$/name: cloudflare-deploy/' "$REPO_ROOT/$target/SKILL.md"
  ensure_license "$target" Apache-2.0
  create_zip "$target"
done

echo "Done syncing cloudflare-skills."
