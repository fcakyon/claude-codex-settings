#!/bin/bash
# Sync SEO skills from Vercel Labs into plugins/seo-skills.
# Usage: bash .github/scripts/sync-seo-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/vercel-labs/marketing-team-eve-template vercel-marketing-team-eve-template

SRC="$HOME/dev/vercel-marketing-team-eve-template/agent/subagents/seo/skills"
SKILLS=(seo-audit programmatic-seo schema site-architecture)

for skill in "${SKILLS[@]}"; do
  sync_dir "$SRC/$skill" "plugins/seo-skills/skills/$skill" "SKILL.md" "references/"
  skill_md="$REPO_ROOT/plugins/seo-skills/skills/$skill/SKILL.md"
  if ! rg -q '^name:' "$skill_md"; then
    sed -i '' "1a\\
name: $skill
" "$skill_md"
  fi
  ensure_license "plugins/seo-skills/skills/$skill" MIT
done

SCHEMA_DIR="$REPO_ROOT/plugins/seo-skills/skills/schema"
sed -i '' \
  's/the form `validate_schema` reads/the form the bundled validator reads/' \
  "$SCHEMA_DIR/SKILL.md"
sed -i '' \
  's/Run `validate_schema` on any block before you hand it over\./From this skill directory, run `node scripts\/validate_schema.mjs <jsonld-file>` on any block before you hand it over./' \
  "$SCHEMA_DIR/SKILL.md"

for script in schema/validate_schema.mjs seo-audit/check_llms_txt.mjs seo-audit/check_head.mjs; do
  dir="$REPO_ROOT/plugins/seo-skills/skills/${script%/*}/scripts"
  mkdir -p "$dir"
  install -m 755 "$REPO_ROOT/.github/scripts/seo-skills/${script#*/}" "$dir/"
done

sed -i '' \
  -e 's#roughly 50 to 60 characters, brand at the end if included#descriptive and concise. Google sets no length limit and truncates the title link to fit the device width, so there is no fixed character cutoff. Brand with just the site name at the start or end after a hyphen, colon, or pipe, which Google may leave out when the result already shows it#' \
  -e 's#Unique, roughly 150 characters or under since mobile truncates near 120, states#Unique, states#' \
  -e 's#earns the click. Not a ranking factor#earns the click. Google sets no length limit and truncates the snippet to fit the device width. Not a ranking factor#' \
  -e 's#| Exactly one, describes the page,#| Describes the page,#' \
  -e 's#| H1 then H2 then H3 with no skipped levels, subheads readable as a map of the page |#| Subheads read as a map of the page. Google says heading order and count do not matter for Search, so report skipped levels as an accessibility fix |#' \
  -e '/^- Google Search Central, Sitemaps overview:/i\
- Google Search Central, Influencing title links: https://developers.google.com/search/docs/appearance/title-link\
- Google Search Central, Control your snippets: https://developers.google.com/search/docs/appearance/snippet\
- Google Search Central, SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
' \
  "$REPO_ROOT/plugins/seo-skills/skills/seo-audit/references/audit-checklist.md"

sed -i '' \
  -e 's#^- Codes are ISO 639-1 language plus optional ISO 3166-1 alpha-2 region: `en`, `en-GB`. Never `en-UK`.#- Codes are ISO 639-1 language, optional ISO 15924 script, and optional ISO 3166-1 alpha-2 region: `en`, `zh-Hant`, `en-GB`. Never `en-UK` or `es-419`.#' \
  -e 's#^- `x-default` is present and points at the fallback#- `x-default`, which Google recommends but does not require, points at the fallback#' \
  -e 's#Query parameters (`?lang=en`) do not\.#Google lists query parameters (`?lang=en`) as not recommended.#' \
  -e 's#Googlebot crawls from US IPs and sends no `Accept-Language`, so it will only ever see one version\.#Googlebot crawls from US IPs by default and sends no `Accept-Language`, so it may never see the other versions.#' \
  "$REPO_ROOT/plugins/seo-skills/skills/seo-audit/references/international-seo.md"

sed -i '' \
  's#Breadcrumbs mirror the URL path exactly, with every segment#Breadcrumbs follow the path a typical user takes to the page, which Google recommends over mirroring the URL, with every segment#' \
  "$REPO_ROOT/plugins/seo-skills/skills/site-architecture/SKILL.md"

# Insert local field notes ahead of each skill's References or Sources section.
for notes in "$REPO_ROOT"/.github/scripts/seo-skills/field-notes/*.md; do
  python3 - "$notes" "$REPO_ROOT/plugins/seo-skills/skills/$(basename "$notes" .md)/SKILL.md" <<'PY'
import re
import sys
from pathlib import Path

notes, skill = Path(sys.argv[1]).read_text().strip(), Path(sys.argv[2])
text = skill.read_text()
match = re.search(r"^## (References|Sources)$", text, re.M)
at = match.start() if match else len(text)
skill.write_text(f"{text[:at].rstrip()}\n\n{notes}\n\n{text[at:]}".rstrip() + "\n")
PY
done

for skill in "${SKILLS[@]}"; do
  create_zip "plugins/seo-skills/skills/$skill"
done

echo "Done syncing seo-skills."
