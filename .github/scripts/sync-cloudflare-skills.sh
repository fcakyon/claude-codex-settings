#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/cloudflare/skills cloudflare-skills
SRC="$HOME/dev/cloudflare-skills/skills"

sync_dir "$SRC/cloudflare" "plugins/cloudflare-skills/skills/cloudflare-deploy" "SKILL.md" "references/"

# rename skill to cloudflare-deploy
sed -i '' 's/^name: cloudflare$/name: cloudflare-deploy/' "plugins/cloudflare-skills/skills/cloudflare-deploy/SKILL.md"
sed -i '' 's|\[nextjs-on-cloudflare skill\](../nextjs-on-cloudflare/SKILL.md); ||' \
  "plugins/cloudflare-skills/skills/cloudflare-deploy/SKILL.md"
sed -i '' 's|\[Durable Objects skill\](../../../durable-objects/SKILL.md)|[Durable Objects docs](https://developers.cloudflare.com/durable-objects/)|' \
  "plugins/cloudflare-skills/skills/cloudflare-deploy/references/do-storage/README.md"
sed -i '' 's|../../../durable-objects/references/testing.md|https://developers.cloudflare.com/durable-objects/examples/testing-with-durable-objects/|' \
  "plugins/cloudflare-skills/skills/cloudflare-deploy/references/do-storage/testing.md"

ensure_license "plugins/cloudflare-skills/skills/cloudflare-deploy" Apache-2.0
create_zip "plugins/cloudflare-skills/skills/cloudflare-deploy"

echo "Done syncing cloudflare-skills."
