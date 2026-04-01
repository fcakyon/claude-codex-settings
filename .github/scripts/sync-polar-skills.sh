#!/bin/bash
# Sync official Polar agent-skills into plugins/polar-skills.
# Usage: bash .github/scripts/sync-polar-skills.sh
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/polarsource/polar polar
SRC="$HOME/dev/polar/.agents/skills"
DST="plugins/polar-skills/skills"

# polar-billing: bare file with no frontmatter -> wrap in skill dir + prepend frontmatter
mkdir -p "$REPO_ROOT/$DST/polar-billing"
cp "$SRC/polar-billing.md" "$REPO_ROOT/$DST/polar-billing/SKILL.md"
python3 -c "
p = '$REPO_ROOT/$DST/polar-billing/SKILL.md'
c = open(p).read()
open(p, 'w').write('---\nname: polar-billing\ndescription: \"This skill should be used when working on Polar billing system, Stripe integration, subscription lifecycle, checkout flows, or benefit provisioning.\"\n---\n\n' + c)
"

# polar-local-environment: rename from local-environment, patch name in frontmatter
sync_dir "$SRC/local-environment" "$DST/polar-local-environment" "SKILL.md" "rules/"
python3 -c "
p = '$REPO_ROOT/$DST/polar-local-environment/SKILL.md'
c = open(p).read()
c = c.replace('name: local-environment', 'name: polar-local-environment', 1)
c = c.replace('description: Local development environment management for Polar using Docker', 'description: \"This skill should be used when setting up or managing Polar local development environment with Docker.\"', 1)
open(p, 'w').write(c)
"

for skill in polar-billing polar-local-environment; do
  ensure_license "$DST/$skill" Apache-2.0
  create_zip "$DST/$skill"
done

echo "Done syncing polar-skills."
