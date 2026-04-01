#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/cloudflare/skills cloudflare-skills
SRC="$HOME/dev/cloudflare-skills/skills"

sync_dir "$SRC/cloudflare" "plugins/cloudflare-skills/skills/cloudflare-deploy" "SKILL.md" "references/"

# rename skill to cloudflare-deploy
sed -i '' 's/^name: cloudflare$/name: cloudflare-deploy/' "plugins/cloudflare-skills/skills/cloudflare-deploy/SKILL.md"

ensure_license "plugins/cloudflare-skills/skills/cloudflare-deploy" Apache-2.0
create_zip "plugins/cloudflare-skills/skills/cloudflare-deploy"

echo "Done syncing cloudflare-skills."
