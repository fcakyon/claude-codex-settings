#!/bin/bash
# Sync Dokploy docs and CLI command index into plugins/dokploy-skills.
# Usage: bash .github/scripts/sync-dokploy-skills.sh
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/Dokploy/website dokploy-website
clone_or_update https://github.com/Dokploy/cli dokploy-cli

WEBSITE_SRC="$HOME/dev/dokploy-website/apps/docs/content/docs"
CLI_SRC="$HOME/dev/dokploy-cli/src"
DST="plugins/dokploy-skills/skills/dokploy-deploy"
REF_DIR="$REPO_ROOT/$DST/references"

rm -rf "$REF_DIR"
mkdir -p \
  "$REF_DIR/getting-started" \
  "$REF_DIR/cloud" \
  "$REF_DIR/applications" \
  "$REF_DIR/docker-compose" \
  "$REF_DIR/databases" \
  "$REF_DIR/domains" \
  "$REF_DIR/remote-servers"

cp "$WEBSITE_SRC/core/installation.mdx" "$REF_DIR/getting-started/installation.mdx"
cp "$WEBSITE_SRC/core/manual-installation.mdx" "$REF_DIR/getting-started/manual-installation.mdx"
cp "$WEBSITE_SRC/core/cloud.mdx" "$REF_DIR/cloud/cloud.mdx"
cp -R "$WEBSITE_SRC/core/applications/." "$REF_DIR/applications/"
cp -R "$WEBSITE_SRC/core/docker-compose/." "$REF_DIR/docker-compose/"
cp -R "$WEBSITE_SRC/core/databases/." "$REF_DIR/databases/"
cp -R "$WEBSITE_SRC/core/domains/." "$REF_DIR/domains/"
cp -R "$WEBSITE_SRC/core/remote-servers/." "$REF_DIR/remote-servers/"

CLI_SRC="$CLI_SRC" REF_DIR="$REF_DIR" python3 - << 'PY'
from collections import defaultdict
from pathlib import Path
import os
import re

cli_src = Path(os.environ["CLI_SRC"])
out_path = Path(os.environ["REF_DIR"]) / "cli-commands.md"
groups: dict[str, list[tuple[str, str]]] = defaultdict(list)

# src/generated/commands.ts: openapi-generated subcommands chained off g_<id> vars.
generated = (cli_src / "generated/commands.ts").read_text()
group_by_var = {
    m.group(1): m.group(2)
    for m in re.finditer(
        r"const (g_\w+) = program\.command\(['\"]([^'\"]+)['\"]\)\.description",
        generated,
    )
}
if not group_by_var:
    raise SystemExit("No groups parsed from generated/commands.ts; upstream layout may have changed.")

for m in re.finditer(
    r"\b(g_\w+)\s*\n\s*\.command\(['\"]([^'\"]+)['\"]\)\s*\n\s*\.description\(['\"]([^'\"]+)['\"]\)",
    generated,
):
    group_name = group_by_var.get(m.group(1))
    if not group_name:
        continue
    groups[group_name].append((f"dokploy {group_name} {m.group(2)}", m.group(3)))

# src/commands/auth.ts: hand-written top-level command using program.command(...).
auth = (cli_src / "commands/auth.ts").read_text()
for m in re.finditer(
    r"\bprogram\s*\n\s*\.command\(['\"]([^'\"]+)['\"]\)\s*\n\s*\.description\(['\"]([^'\"]+)['\"]\)",
    auth,
):
    groups[m.group(1)].append((f"dokploy {m.group(1)}", m.group(2)))

if "auth" not in groups:
    raise SystemExit("Auth command not parsed from commands/auth.ts; upstream layout may have changed.")

with out_path.open("w") as handle:
    handle.write("# Dokploy CLI Commands\n\n")
    handle.write("Generated from `Dokploy/cli` source files.\n\n")
    for group in sorted(groups):
        handle.write(f"## {group}\n\n")
        for command, description in sorted(groups[group]):
            handle.write(f"- `{command}` - {description}\n")
        handle.write("\n")
PY

cat > "$REPO_ROOT/$DST/SKILL.md" << 'SKILL_EOF'
---
name: dokploy-deploy
description: This skill should be used when user asks to "deploy with Dokploy", "use Dokploy Cloud", "manage self-hosted Dokploy", "deploy Docker Compose on Dokploy", "manage Dokploy databases", "configure Dokploy domains", or "look up Dokploy CLI commands".
references:
  - cloud
  - getting-started
  - applications
  - cli-commands
license: MIT
---

# Dokploy Deploy Skill

Skill for working with Dokploy Cloud and self-hosted Dokploy dashboards. Use the copied Dokploy docs for dashboard workflows and `references/cli-commands.md` for the CLI command index.

Your knowledge of Dokploy plans, install flow, and product behavior may be outdated. Prefer the local references over memory when you need current steps or product wording.

## Quick Decision Trees

### "I need to choose Dokploy Cloud or self-hosted"

```text
Need Dokploy Cloud?
├─ Managed Dokploy control plane → references/cloud/cloud.mdx
├─ Deploy to remote servers from Dokploy Cloud → references/cloud/cloud.mdx
└─ Need the dashboard docs too → references/remote-servers/ + references/applications/

Need self-hosted Dokploy?
├─ Fresh install → references/getting-started/installation.mdx
├─ Custom install settings → references/getting-started/manual-installation.mdx
└─ Day-to-day dashboard usage → references/applications/, references/docker-compose/, references/databases/
```

### "I need to deploy applications"

```text
Need app deploy workflow?
├─ App overview and tabs → references/applications/index.mdx
├─ Build and deploy details → references/applications/build-type.mdx
├─ Production guidance → references/applications/going-production.mdx
├─ Zero downtime or rollbacks → references/applications/zero-downtime.mdx and references/applications/rollbacks.mdx
└─ Preview deploys → references/applications/preview-deployments.mdx
```

### "I need Docker Compose"

```text
Need Docker Compose?
├─ Main workflow → references/docker-compose/index.mdx
├─ Domain handling → references/docker-compose/domains.mdx
├─ Example setup → references/docker-compose/example.mdx
└─ Utility details → references/docker-compose/utilities.mdx
```

### "I need databases"

```text
Need database docs?
├─ Overview → references/databases/index.mdx
├─ Backups or restore → references/databases/backups.mdx and references/databases/restore.mdx
├─ Connection docs → references/databases/connection/
└─ CLI command lookup → references/cli-commands.md
```

### "I need domains or HTTPS"

```text
Need domains?
├─ Main domain workflow → references/domains/index.mdx
├─ Generated domains → references/domains/generated.mdx
├─ Cloudflare-specific flow → references/domains/cloudflare.mdx
└─ Other DNS providers → references/domains/others.mdx
```

### "I need remote servers"

```text
Need remote servers?
├─ Feature overview → references/remote-servers/index.mdx
├─ Build server flow → references/remote-servers/build-server.mdx
├─ Deployment flow → references/remote-servers/deployments.mdx
├─ Setup instructions → references/remote-servers/instructions.mdx
└─ Security and validation → references/remote-servers/security.mdx and references/remote-servers/validate.mdx
```

### "I need the Dokploy CLI"

```text
Need CLI lookup?
└─ Full command index → references/cli-commands.md
```

## Working Notes

- Use copied Dokploy docs for product behavior and dashboard steps.
- Use `references/cli-commands.md` for a quick command list sourced from `Dokploy/cli`.
- If the docs and the CLI source disagree, treat the CLI source-derived command index as the source of truth for command names.
SKILL_EOF

create_zip "$DST"

echo "Done syncing dokploy-skills."
