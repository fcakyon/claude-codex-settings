#!/bin/bash
# Package the locally maintained SEO skills without replacing them from upstream.
# Review upstream changes separately before applying them to these sources.
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

for skill in seo-audit programmatic-seo schema site-architecture; do
  create_zip "plugins/seo-skills/skills/$skill"
done

echo "Packaged local SEO skills. No upstream files were copied."
