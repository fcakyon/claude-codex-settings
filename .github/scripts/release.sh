#!/bin/bash
# Create a GitHub release with skill ZIPs from one committed revision.
# Usage: bash .github/scripts/release.sh <version> [--dry-run]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ $# -lt 1 ] || [ $# -gt 2 ]
then
  echo "Usage: $0 <version> [--dry-run]" >&2
  exit 1
fi
VERSION="$1"
TAG="v$VERSION"
if [ "${2:---dry-run}" != --dry-run ]
then
  echo "Unknown option: $2" >&2
  exit 1
fi
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
then
  echo "ERROR: version must be semver (e.g. 2.10.0), got: $VERSION" >&2
  exit 1
fi

cd "$REPO_ROOT"
COMMIT="$(git rev-parse HEAD)"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT
git archive "$COMMIT" | tar -x -C "$STAGING"

python3 - "$STAGING/.claude-plugin/marketplace.json" "$VERSION" <<'PY'
import json
import sys
from pathlib import Path

current = json.loads(Path(sys.argv[1]).read_text())["metadata"]["version"]
if current != sys.argv[2]:
    raise SystemExit(f"Marketplace version is {current}, expected {sys.argv[2]}. Commit the version bump first.")
PY

# A fresh Git snapshot has no cached ZIPs or uncommitted skill files.
source "$STAGING/.github/scripts/_helpers.sh"
create_all_skill_zips

python3 - "$STAGING" <<'PY'
import sys
from pathlib import Path
from zipfile import ZipFile

root = Path(sys.argv[1])
skills = sorted(root.glob("plugins/*/skills/*/SKILL.md"))
archives = sorted(root.glob("plugins/*/skills/*/*.zip"))
assert skills and len(archives) == len(skills), "Expected one ZIP per skill"
assert len({p.name for p in archives}) == len(archives), "Duplicate release asset names"
for skill in skills:
    archive, = skill.parent.glob("*.zip")
    expected = {
        f"{skill.parent.name}/{p.relative_to(skill.parent).as_posix()}": p.read_bytes()
        for p in skill.parent.rglob("*") if p.is_file() and p.suffix != ".zip"
    }
    with ZipFile(archive) as zipped:
        actual = {name: zipped.read(name) for name in zipped.namelist() if not name.endswith("/")}
        assert actual == expected, f"ZIP contents differ from committed skill: {archive}"
print(f"Verified {len(archives)} unique skill ZIPs against the committed source")
PY

ZIP_FILES=()
while IFS= read -r -d '' file
do
  ZIP_FILES+=("$file")
done < <(find "$STAGING/plugins" -name '*.zip' -print0)

if [ "${2:-}" = --dry-run ]
then
  echo "Dry run: $TAG at $COMMIT, ${#ZIP_FILES[@]} ZIPs. Nothing published."
  exit 0
fi

PREV_TAG="$(gh release list --limit 1 --json tagName -q '.[0].tagName')"
cp "$STAGING/README.md" "$STAGING/release-notes.md"
if [ -n "$PREV_TAG" ]
then
  printf '\n---\n\n' >> "$STAGING/release-notes.md"
  gh api repos/{owner}/{repo}/releases/generate-notes \
    -f tag_name="$TAG" -f previous_tag_name="$PREV_TAG" \
    -f target_commitish="$COMMIT" -q .body >> "$STAGING/release-notes.md"
fi

gh release create "$TAG" "${ZIP_FILES[@]}" --target "$COMMIT" \
  --title "$TAG" --notes-file "$STAGING/release-notes.md" --latest

echo "Release $TAG created from $COMMIT"
gh release view "$TAG" --json url -q .url
