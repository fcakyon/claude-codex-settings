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

# Skills with a references/ dir upstream.
sync_dir "$SRC/atlas-stream-processing" "plugins/mongodb-skills/skills/atlas-stream-processing" "SKILL.md" "references/"
sync_dir "$SRC/mongodb-connection" "plugins/mongodb-skills/skills/mongodb-connection" "SKILL.md" "references/"
sync_dir "$SRC/mongodb-query-optimizer" "plugins/mongodb-skills/skills/mongodb-query-optimizer" "SKILL.md" "references/"
sync_dir "$SRC/mongodb-schema-design" "plugins/mongodb-skills/skills/mongodb-schema-design" "SKILL.md" "references/"
sync_dir "$SRC/mongodb-search-and-ai" "plugins/mongodb-skills/skills/mongodb-search-and-ai" "SKILL.md" "references/"

# Skills without references/ upstream.
sync_dir "$SRC/mongodb-mcp-setup" "plugins/mongodb-skills/skills/mongodb-mcp-setup" "SKILL.md"
sync_dir "$SRC/mongodb-natural-language-querying" "plugins/mongodb-skills/skills/mongodb-natural-language-querying" "SKILL.md"

for skill in "${SKILLS[@]}"; do
  ensure_license "plugins/mongodb-skills/skills/$skill" Apache-2.0
  create_zip "plugins/mongodb-skills/skills/$skill"
done

echo "Done syncing mongodb-skills."
