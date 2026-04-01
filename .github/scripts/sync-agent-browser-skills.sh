#!/bin/bash
# Sync agent-browser skills into plugins/agent-browser.
# Usage: bash .github/scripts/sync-agent-browser-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/vercel-labs/agent-browser agent-browser

SRC="$HOME/dev/agent-browser/skills"

sync_dir "$SRC/agent-browser" "plugins/agent-browser/skills/agent-browser" "SKILL.md" "references/" "templates/"
ensure_license "plugins/agent-browser/skills/agent-browser" Apache-2.0
create_zip "plugins/agent-browser/skills/agent-browser"

sync_dir "$SRC/electron" "plugins/agent-browser/skills/electron" "SKILL.md"
ensure_license "plugins/agent-browser/skills/electron" Apache-2.0
create_zip "plugins/agent-browser/skills/electron"

echo "Done syncing agent-browser skills."
