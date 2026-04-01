#!/bin/bash
# Sync Supabase CLI docs into plugins/supabase-skills as supabase-cli skill.
# Extracts extended command descriptions and examples from supabase/cli.
# Usage: bash .github/scripts/sync-supabase-cli-skills.sh
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/supabase/cli supabase-cli develop
SRC="$HOME/dev/supabase-cli"
DST="plugins/supabase-skills/skills/supabase-cli"

# Clean target
rm -rf "$REPO_ROOT/$DST"
mkdir -p "$REPO_ROOT/$DST/references"

# Copy extended command descriptions grouped by category
CATEGORIES=(db migration functions inspect config domains test)
for cat in "${CATEGORIES[@]}"; do
  if [ -d "$SRC/docs/supabase/$cat" ]; then
    mkdir -p "$REPO_ROOT/$DST/references/$cat"
    cp "$SRC/docs/supabase/$cat/"*.md "$REPO_ROOT/$DST/references/$cat/"
    echo "  Copied $cat/ docs"
  fi
done

# Copy top-level command docs into a "commands" reference dir
mkdir -p "$REPO_ROOT/$DST/references/commands"
for f in "$SRC/docs/supabase/"*.md; do
  [ -f "$f" ] && cp "$f" "$REPO_ROOT/$DST/references/commands/"
done
echo "  Copied top-level command docs"

# Copy examples
cp "$SRC/docs/templates/examples.yaml" "$REPO_ROOT/$DST/references/examples.yaml"
echo "  Copied examples.yaml"

# Copy CLI README
cp "$SRC/README.md" "$REPO_ROOT/$DST/references/overview.md"

echo "Copied all reference files"

# Write SKILL.md
cat > "$REPO_ROOT/$DST/SKILL.md" << 'SKILL_EOF'
---
name: supabase-cli
description: This skill should be used when user asks to "use supabase CLI", "supabase init", "supabase start", "run migrations", "deploy edge functions", "manage Supabase project", or works with the supabase command-line tool for local development and project management.
references:
  - commands
  - db
  - migration
  - functions
license: MIT
---

# Supabase CLI Skill

Skill for local development, migrations, edge functions, and project management with the `supabase` CLI. Official docs: https://supabase.com/docs/reference/cli/about

## Installation

```bash
# macOS / Linux (Homebrew)
brew install supabase/tap/supabase

# npm
npm install -g supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Authentication

```bash
# Login with access token from https://supabase.com/dashboard/account/tokens
supabase login

# Link to a project
supabase link --project-ref <project-id>
```

## Quick Decision Trees

### "I need local development"

```
Local dev?
├─ Initialize project → supabase init
├─ Start local stack → supabase start
│  ├─ Without specific services → supabase start -x studio,imgproxy
│  └─ Status → supabase status
├─ Stop local stack → supabase stop
│  └─ Clean up data → supabase stop --no-backup
├─ View service URLs → supabase status
└─ Bootstrap from template → supabase bootstrap
```

### "I need database migrations"

```
Migrations?
├─ Create new migration → supabase migration new <name>
├─ Apply pending migrations → supabase migration up
│  └─ Rollback → supabase migration down
├─ Diff local changes → supabase db diff
│  └─ Save as migration → supabase db diff -f <name>
├─ Pull remote schema → supabase db pull
├─ Push local migrations → supabase db push
├─ Reset local database → supabase db reset
├─ List migrations → supabase migration list
├─ Squash migrations → supabase migration squash
├─ Run arbitrary SQL → supabase db query 'SELECT 1'
├─ Run pgTAP tests → supabase test db
└─ Lint schema → supabase db lint
```

### "I need edge functions"

```
Edge Functions?
├─ Create new function → supabase functions new <name>
├─ Serve locally → supabase functions serve
│  └─ With env file → supabase functions serve --env-file .env.local
├─ Deploy to project → supabase functions deploy <name>
│  └─ Deploy all → supabase functions deploy
├─ Delete function → supabase functions delete <name>
├─ List functions → supabase functions list
└─ Download function → supabase functions download <name>
```

### "I need to manage secrets"

```
Secrets?
├─ Set secrets → supabase secrets set KEY=value KEY2=value2
├─ Set from .env file → supabase secrets set --env-file .env
├─ List secrets → supabase secrets list
└─ Unset secrets → supabase secrets unset KEY KEY2
```

### "I need code generation"

```
Code gen?
├─ TypeScript types from DB → supabase gen types typescript --project-id <id>
│  └─ From local DB → supabase gen types typescript --local
├─ Signing key → supabase gen signing-key
└─ Bearer JWT → supabase gen bearer-jwt --project-ref <ref>
```

### "I need to inspect the database"

```
Inspect?
├─ Database stats → supabase inspect db db-stats
├─ Slow queries → supabase inspect db outliers
├─ Lock monitoring → supabase inspect db locks / blocking
├─ Long running queries → supabase inspect db long-running-queries
├─ Index analysis → supabase inspect db index-usage / unused-indexes
├─ Table sizes → supabase inspect db table-sizes / table-record-counts
├─ Cache hit ratio → supabase inspect db cache-hit
├─ Bloat → supabase inspect db bloat
├─ Vacuum stats → supabase inspect db vacuum-stats
└─ Replication slots → supabase inspect db replication-slots
```

### "I need project management"

```
Project management?
├─ Create project → supabase projects create <name> --org-id <id> --db-password <pw> --region <r>
├─ List projects → supabase projects list
├─ Delete project → supabase projects delete --project-ref <ref>
├─ API keys → supabase projects api-keys --project-ref <ref>
├─ Organizations → supabase orgs list / create
├─ Custom domains → supabase domains create / get / activate
├─ Preview branches → supabase branches create / list / delete
├─ Backups (PITR) → supabase backups list / restore
├─ SSO management → supabase sso add / list / remove
└─ Push config → supabase config push
```

## Common Workflows

### New project setup

```bash
supabase init
supabase start
# Make schema changes in Supabase Studio (http://127.0.0.1:54323)
supabase db diff -f initial_schema
supabase stop
```

### Migration workflow

```bash
# Create migration from local changes
supabase db diff -f add_profiles_table

# Or write SQL directly
supabase migration new add_profiles_table
# Edit supabase/migrations/<timestamp>_add_profiles_table.sql

# Test locally
supabase db reset
supabase test db

# Deploy to remote
supabase db push
```

### Edge function development

```bash
supabase functions new my-function
# Edit supabase/functions/my-function/index.ts
supabase functions serve  # local dev with hot reload
supabase functions deploy my-function
```

### Generate types after schema change

```bash
# From remote project
supabase gen types typescript --project-id <id> > database.types.ts

# From local running instance
supabase gen types typescript --local > database.types.ts
```

## Reference Index

| Category | Reference | Description |
|----------|-----------|-------------|
| Top-level commands | `references/commands/` | init, start, stop, status, login, link |
| Database | `references/db/` | diff, dump, lint, pull, push, reset, query |
| Migrations | `references/migration/` | list, new, repair, squash, up, down |
| Edge Functions | `references/functions/` | new, serve, deploy, delete |
| Inspect | `references/inspect/` | 20+ database inspection subcommands |
| Config | `references/config/` | push config to remote |
| Domains | `references/domains/` | custom domain management |
| Tests | `references/test/` | pgTAP database tests |
| Examples | `references/examples.yaml` | Usage examples for all commands |
SKILL_EOF

echo "Wrote SKILL.md"

ensure_license "$DST" MIT
create_zip "$DST"

echo "Done syncing supabase-cli skill."
