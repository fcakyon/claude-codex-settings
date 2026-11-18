#!/usr/bin/env bash
# Sync both skills from Google's integrity-locked npm release.
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

plugin=plugins/modern-web-guidance
web="$plugin/skills/modern-web-guidance"
extension="$plugin/skills/chrome-extensions"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
cp "$REPO_ROOT/$web/scripts/"package*.json "$stage/"
npm ci --prefix "$stage" --ignore-scripts --no-audit --no-fund
upstream="$stage/node_modules/modern-web-guidance"

# Replace only the vendor-owned directory so removed upstream guides disappear.
rm -rf "$REPO_ROOT/$web/guides"
cp -R "$upstream/skills/modern-web-guidance/guides" "$REPO_ROOT/$web/"
sync_dir "$upstream/skills/chrome-extensions" "$extension" SKILL.md references/
for skill in "$web" "$extension"; do
  cp "$upstream/LICENSE" "$upstream/THIRD_PARTY_NOTICES" "$REPO_ROOT/$skill/"
  create_zip "$skill"
done
