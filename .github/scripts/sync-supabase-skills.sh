#!/bin/bash
# Sync official Supabase agent-skills into plugins/supabase-skills.
# Usage: bash .github/scripts/sync-supabase-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/supabase/agent-skills supabase-agent-skills

SRC="$HOME/dev/supabase-agent-skills/skills"

for dir in "$SRC"/*/; do
  sync_skill "${dir%/}" "plugins/supabase-skills/skills/$(basename "$dir")" MIT
done

echo "Done syncing supabase-skills."
