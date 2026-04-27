#!/bin/bash
# Sync frontend design skills from OpenAI and Anthropic into plugins/frontend-design-skills.
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
create_zip "plugins/frontend-design-skills/skills/anthropic-frontend-design"

echo "Done syncing frontend-design-skills."
