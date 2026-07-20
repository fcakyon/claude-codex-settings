#!/bin/bash
# Rebuild release zips for the openai-office skills, which are frozen local
# copies (upstream is deprecated). pdf gets a distinct asset name so it does not
# collide with the anthropic-office pdf.
# Usage: bash .github/scripts/sync-openai-office-skills.sh

set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

create_zip "plugins/openai-office-skills/skills/pdf" openai-pdf
for skill in doc slides spreadsheet; do
  create_zip "plugins/openai-office-skills/skills/$skill"
done

echo "Done packaging openai-office-skills."
