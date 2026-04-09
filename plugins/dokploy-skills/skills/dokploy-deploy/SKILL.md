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
├─ Command index → references/cli-commands.md
├─ Auth commands → Authentication section
├─ Project commands → Project section
├─ App commands → Application section
├─ Env commands → Environment section
└─ Database commands → Databases section
```

## Working Notes

- Use copied Dokploy docs for product behavior and dashboard steps.
- Use `references/cli-commands.md` for a quick command list sourced from `Dokploy/cli`.
- If the docs and the CLI source disagree, treat the CLI source-derived command index as the source of truth for command names.
