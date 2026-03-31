#!/bin/bash
# Sync official Supabase agent-skills into plugins/supabase-skills.
# Usage: bash .github/scripts/sync-supabase-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/supabase/agent-skills supabase-agent-skills

SRC="$HOME/dev/supabase-agent-skills/skills"

sync_dir "$SRC/supabase-postgres-best-practices" \
  plugins/supabase-skills/skills/supabase-postgres-best-practices \
  "SKILL.md" "references/"

ensure_license plugins/supabase-skills/skills/supabase-postgres-best-practices MIT
create_zip plugins/supabase-skills/skills/supabase-postgres-best-practices

echo "Done syncing supabase-skills."
