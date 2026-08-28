#!/bin/bash
# Create a GitHub release with skill zips as artifacts.
# Usage: bash .github/scripts/release.sh <version>
# Example: bash .github/scripts/release.sh 2.4.0

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPTS_DIR="$(dirname "$0")"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <version>" >&2
  echo "Example: $0 2.4.0" >&2
  exit 1
fi

VERSION="$1"
TAG="v$VERSION"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: version must be semver (e.g. 2.4.0), got: $VERSION" >&2
  exit 1
fi

cd "$REPO_ROOT"

# Check the marketplace version. gh release create tags the pushed branch, so a local
# edit here would never reach the release. The bump belongs in the commit that precedes it.
python3 -c "
import json
from pathlib import Path
current = json.loads(Path('.claude-plugin/marketplace.json').read_text())['metadata']['version']
if current != '$VERSION':
    raise SystemExit(
        'ERROR: marketplace metadata.version is ' + current + ', expected $VERSION. '
        'Bump it, run sync-versions.sh, then commit and merge before releasing.'
    )
print('Marketplace metadata.version is $VERSION')
"

# Sync all plugin versions across platforms
bash "$SCRIPTS_DIR/sync-versions.sh"

# Re-run all sync scripts to ensure all vendor zips are current.
find plugins -name '*.zip' -delete
for sync_script in "$SCRIPTS_DIR"/sync-*-skills.sh; do
  [ -f "$sync_script" ] && bash "$sync_script"
done

# Package local skills that the vendor syncs did not cover.
source "$SCRIPTS_DIR/_helpers.sh"
create_all_skill_zips

# Collect zip files from skill directories
ZIP_FILES=()
while IFS= read -r -d '' f; do
  ZIP_FILES+=("$f")
done < <(find plugins -name '*.zip' -print0)

if [ ${#ZIP_FILES[@]} -eq 0 ]; then
  echo "WARNING: no zip files found in plugins/*/skills/*/" >&2
fi

echo "Found ${#ZIP_FILES[@]} zip file(s) to upload"
for z in "${ZIP_FILES[@]}"; do echo "  $z"; done

# Get previous tag for changelog generation
PREV_TAG=$(gh release list --limit 1 --json tagName -q '.[0].tagName' 2> /dev/null || echo "")

# Generate auto-changelog
CHANGELOG=""
if [ -n "$PREV_TAG" ]; then
  CHANGELOG=$(gh api repos/{owner}/{repo}/releases/generate-notes \
    -f tag_name="$TAG" \
    -f previous_tag_name="$PREV_TAG" \
    -q '.body' 2> /dev/null || echo "")
fi

# Combine release body: README + changelog
README_CONTENT=$(cat README.md)
BODY="$README_CONTENT"
if [ -n "$CHANGELOG" ]; then
  BODY="$README_CONTENT

---

$CHANGELOG"
fi

# Create release with zip artifacts
if [ ${#ZIP_FILES[@]} -gt 0 ]; then
  gh release create "$TAG" "${ZIP_FILES[@]}" \
    --title "$TAG" \
    --notes "$BODY"
else
  gh release create "$TAG" \
    --title "$TAG" \
    --notes "$BODY"
fi

echo ""
echo "Release $TAG created."
echo "URL: $(gh release view "$TAG" --json url -q '.url')"
