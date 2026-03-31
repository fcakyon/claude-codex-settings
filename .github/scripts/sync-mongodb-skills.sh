#!/bin/bash
# Sync official MongoDB agent-skills into plugins/mongodb-skills.
# Usage: bash .github/scripts/sync-mongodb-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/mongodb/agent-skills mongodb-agent-skills

SRC="$HOME/dev/mongodb-agent-skills/skills"

SKILLS=(
  atlas-stream-processing
  mongodb-connection
  mongodb-mcp-setup
  mongodb-natural-language-querying
  mongodb-query-optimizer
  mongodb-schema-design
  mongodb-search-and-ai
)

for skill in "${SKILLS[@]}"; do
  sync_dir "$SRC/$skill" \
    "plugins/mongodb-skills/skills/$skill" \
    "SKILL.md" "references/"
  ensure_license "plugins/mongodb-skills/skills/$skill" Apache-2.0
  create_zip "plugins/mongodb-skills/skills/$skill"
done

echo "Done syncing mongodb-skills."
