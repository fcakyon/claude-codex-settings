#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/cloudflare/skills cloudflare-skills
SRC="$HOME/dev/cloudflare-skills/skills"

sync_dir "$SRC/web-perf" "plugins/web-performance-skills/skills/web-performance-optimization" "SKILL.md"
sed -i '' 's/^name: web-perf$/name: web-performance-optimization/' \
  "$REPO_ROOT/plugins/web-performance-skills/skills/web-performance-optimization/SKILL.md"

ensure_license "plugins/web-performance-skills/skills/web-performance-optimization" Apache-2.0
create_zip "plugins/web-performance-skills/skills/web-performance-optimization"

echo "Done syncing web-performance-skills."
