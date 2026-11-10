#!/bin/bash
# Sync the TypeScript skill and its referenced principles from Cursor's pstack plugin.
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

TARGET="$(mktemp -d)"
trap 'rm -rf "$TARGET"' EXIT
REV="$(gh api repos/cursor/plugins/commits/main -q .sha)"
mkdir -p "$TARGET/references"
for file in SKILL.md references/patterns.md; do
  gh api "repos/cursor/plugins/contents/pstack/skills/typescript-best-practices/$file?ref=$REV" -q .content | base64 -d > "$TARGET/$file"
done
for principle in type-system-discipline boundary-discipline; do
  gh api "repos/cursor/plugins/contents/pstack/skills/principle-$principle/SKILL.md?ref=$REV" -q .content | base64 -d > "$TARGET/references/$principle.md"
done
gh api "repos/cursor/plugins/contents/pstack/LICENSE?ref=$REV" -q .content | base64 -d > "$TARGET/LICENSE"
sed -i 's|Apply the \*\*type-system-discipline\*\* principle skill first\.|Apply [type system discipline](references/type-system-discipline.md) first.|; s|See the \*\*boundary-discipline\*\* principle skill\.|See [boundary discipline](references/boundary-discipline.md).|; /^paths: /d; /^disable-model-invocation: /d; s|^description:.*|description: This skill should be used when writing, reading, or reviewing TypeScript code and choosing type safety or validation patterns.|' "$TARGET/SKILL.md"
sed -i 's|See the \*\*type-system-discipline\*\* and \*\*boundary-discipline\*\* principle skills\.|See [type system discipline](type-system-discipline.md) and [boundary discipline](boundary-discipline.md).|; s|See the \*\*boundary-discipline\*\* principle skill.|See [boundary discipline](boundary-discipline.md).|g' "$TARGET/references/patterns.md"
sed -i 's|The \*\*boundary-discipline\*\* principle skill|[Boundary discipline](boundary-discipline.md)|; s|See the \*\*encode-lessons-in-structure\*\* principle skill.|See the [upstream principle](https://github.com/cursor/plugins/tree/main/pstack/skills/principle-encode-lessons-in-structure).|' "$TARGET/references/type-system-discipline.md"
sync_dir "$TARGET" "plugins/typescript-skills/skills/typescript-best-practices" .
create_zip "plugins/typescript-skills/skills/typescript-best-practices"
echo "Done syncing typescript-skills."
