#!/bin/bash
# Sync frontend design and writing skills from OpenAI, Anthropic, and Vercel into plugins/frontend-design-skills.
# Usage: bash .github/scripts/sync-frontend-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

# --- OpenAI frontend skill ---
# No ensure_license: openai/plugins repo has no LICENSE file.
clone_or_update https://github.com/openai/plugins openai-plugins

sync_dir "$HOME/dev/openai-plugins/plugins/build-web-apps/skills/frontend-app-builder" \
  "plugins/frontend-design-skills/skills/openai-frontend-design" \
  "SKILL.md" "agents/" "references/"

# Patch frontmatter name to match local directory name (upstream uses frontend-app-builder)
python3 -c "
p = '$REPO_ROOT/plugins/frontend-design-skills/skills/openai-frontend-design/SKILL.md'
t = open(p).read()
open(p, 'w').write(t.replace('name: frontend-app-builder', 'name: openai-frontend-design'))
"

sed -i '' '/^# Frontend App Builder$/a\
\
For interface copy and supporting text, read and apply the installed `writing-guidelines` skill.
' "$REPO_ROOT/plugins/frontend-design-skills/skills/openai-frontend-design/SKILL.md"

create_zip "plugins/frontend-design-skills/skills/openai-frontend-design"

# --- Anthropic frontend skill ---
clone_or_update https://github.com/anthropics/claude-plugins-official anthropic-claude-plugins-official

sync_dir "$HOME/dev/anthropic-claude-plugins-official/plugins/frontend-design/skills/frontend-design" \
  "plugins/frontend-design-skills/skills/anthropic-frontend-design" \
  "SKILL.md"

# Patch frontmatter name and license to match directory name
python3 -c "
p = '$REPO_ROOT/plugins/frontend-design-skills/skills/anthropic-frontend-design/SKILL.md'
t = open(p).read()
t = t.replace('name: frontend-design', 'name: anthropic-frontend-design')
t = t.replace('license: Complete terms in LICENSE.txt', 'license: Apache-2.0')
open(p, 'w').write(t)
"

sed -i '' '/^# Frontend Design$/a\
\
For interface copy and supporting text, read and apply the installed `writing-guidelines` skill.
' "$REPO_ROOT/plugins/frontend-design-skills/skills/anthropic-frontend-design/SKILL.md"

create_zip "plugins/frontend-design-skills/skills/anthropic-frontend-design"

# --- Vercel writing guidelines ---
clone_or_update https://github.com/vercel-labs/writing-guidelines vercel-writing-guidelines

sync_dir "$HOME/dev/vercel-writing-guidelines" \
  "plugins/frontend-design-skills/skills/writing-guidelines" \
  "command.md"

WRITING_DIR="$REPO_ROOT/plugins/frontend-design-skills/skills/writing-guidelines"
mv "$WRITING_DIR/command.md" "$WRITING_DIR/SKILL.md"
python3 -c "
p = '$WRITING_DIR/SKILL.md'
t = open(p).read()
t = t.replace('---\ndescription:', '---\nname: writing-guidelines\ndescription:', 1)
t = t.replace('argument-hint: <file-or-pattern>', 'metadata:\n  argument-hint: <file-or-pattern>', 1)
open(p, 'w').write(t)
"
sed -i '' \
  -e 's|^description:.*$|description: This skill should be used when the user asks to "review writing", "check documentation style", "audit interface copy", or "apply writing guidelines".|' \
  -e 's|^Review these files for compliance: \$ARGUMENTS$|Review the files or patterns provided by the user for compliance.|' \
  -e 's|only for deliberate Vercel actions|only for deliberate organization actions|' \
  -e 's|^- Dashboard deep links use.*$|- Dashboard links should open the exact destination and preserve required context in the URL.|' \
  -e 's|^- Link to canonical product docs.*$|- Link to canonical product documentation when relevant.|' \
  -e 's|^- AI Gateway model catalog:.*$|- Link to the canonical model catalog for the selected provider when examples name models.|' \
  -e 's|sample repo in `vercel/examples` for multi-step tutorials|a sample repository for multi-step tutorials|' \
  -e 's|"Vercel Sandbox"|"Cloud Sandbox"|' \
  "$WRITING_DIR/SKILL.md"
ensure_license "plugins/frontend-design-skills/skills/writing-guidelines" MIT
if rg -qi 'vercel' "$WRITING_DIR/SKILL.md"; then
  echo "ERROR: writing-guidelines must remain vendor-neutral" >&2
  exit 1
fi
create_zip "plugins/frontend-design-skills/skills/writing-guidelines"

echo "Done syncing frontend-design-skills."
