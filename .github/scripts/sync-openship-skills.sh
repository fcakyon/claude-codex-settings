#!/bin/bash
# Sync OpenShip docs and config references from one upstream release.
# Usage: bash .github/scripts/sync-openship-skills.sh [ref]
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

UPSTREAM=oblien/openship
REF="${1:-$(gh api "repos/$UPSTREAM/releases/latest" --jq .tag_name)}"
SHA="$(gh api "repos/$UPSTREAM/commits/$REF" --jq .sha)"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

python3 - "$STAGING" "$REF" "$SHA" <<'PY'
import base64
import hashlib
import json
import re
import sys
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

staging, ref, sha = sys.argv[1:]
staging = Path(staging)
base = f"https://github.com/oblien/openship/blob/{sha}/"
docs = "apps/web/content/docs/"
selections = {
    "openship-deploy": {
        **{f"references/cli/{name}.mdx": f"{docs}cli/{name}.mdx" for name in
           ("index", "access", "deploy", "projects", "edge", "run", "self-host")},
        **{f"references/guides/{name}.mdx": f"{docs}guides/{name}.mdx" for name in
           ("self-hosted-github-app", "custom-domains", "persistent-storage",
            "backups-restore", "updating", "migrate-control-plane")},
    },
    "openship-config": {
        "references/fields.md": ".claude/skills/openship-config/references/fields.md",
        "references/openship.schema.json": "apps/web/public/openship.schema.json",
        **{f"references/{name}.mdx": f"{docs}guides/{name}.mdx" for name in
           ("openship-json", "compose-multi-service", "environment-variables")},
    },
}
source_paths = [
    ".claude/skills/openship-config/SKILL.md",
    "apps/cli/src/commands/config.ts",
    "apps/cli/src/commands/server.ts",
    "apps/cli/src/commands/service.ts",
    "packages/core/src/openship-config/schema.ts",
    "packages/core/src/openship-config/parse.ts",
    "packages/core/src/openship-config/parse.test.ts",
    "apps/api/src/modules/deployments/prepare.service.ts",
]
def fetch(src):
    """Fetch one required file at the resolved commit."""
    response = subprocess.check_output([
        "gh", "api", f"repos/oblien/openship/contents/{src}?ref={sha}",
    ])
    return src, base64.b64decode(json.loads(response)["content"])


with ThreadPoolExecutor(max_workers=4) as pool:
    contents = dict(pool.map(fetch, sorted({"LICENSE", *source_paths,
                                         *(src for files in selections.values() for src in files.values())})))

for skill, files in selections.items():
    destination = staging / skill
    for target, src in files.items():
        output = destination / target
        output.parent.mkdir(parents=True, exist_ok=True)
        data = contents[src]
        if output.suffix in {".md", ".mdx"}:
            text = data.decode()
            # Docs outside the selected set remain links to the official site.
            text = text.replace('](/', '](https://openship.io/').replace('href="/', 'href="https://openship.io/')
            data = ("\n".join(line.rstrip() for line in text.splitlines()) + "\n").encode()
        output.write_bytes(data)
    (destination / "LICENSE").write_bytes(contents["LICENSE"])
    provenance = {
        "repository": "https://github.com/oblien/openship", "ref": ref, "commit": sha,
        "files": {src: {"url": base + src, "sha256": hashlib.sha256(contents[src]).hexdigest()}
                  for src in sorted({"LICENSE", *files.values(), *source_paths})},
    }
    (destination / "references/upstream.json").write_text(json.dumps(provenance, indent=2) + "\n")
    for file in (destination / "references").rglob("*.md*"):
        for link in re.findall(r"\]\(([^\s)]+)\)", file.read_text()):
            target = link.split("#")[0]
            if target and not re.match(r"[a-z]+:", target) and not (file.parent / target).exists():
                raise SystemExit(f"Unresolved local link in {file}: {link}")
json.loads((staging / "openship-config/references/openship.schema.json").read_text())
print(f"Prepared OpenShip {ref} ({sha})")
PY

for skill in openship-deploy openship-config; do
  target="plugins/openship-skills/skills/$skill"
  sync_dir "$STAGING/$skill/references" "$target/references" .
  cp "$STAGING/$skill/LICENSE" "$REPO_ROOT/$target/LICENSE"
  create_zip "$target"
done
