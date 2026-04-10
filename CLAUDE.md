# claude-settings

> `AGENTS.md` and `GEMINI.md` are symlinks to this file for Codex CLI and Gemini CLI compatibility.

Multi-tool plugin marketplace. Each plugin under `plugins/` is independently installable on Claude Code, Codex CLI, Gemini CLI, and Cursor.

## Repo Structure

```
claude-settings/
  CLAUDE.md                              # this file (repo dev guide)
  AGENTS.md -> CLAUDE.md                 # Codex CLI reads this
  GEMINI.md -> CLAUDE.md                 # Gemini CLI reads this
  .claude/CLAUDE.md                      # user-facing global config (synced to ~/.claude/CLAUDE.md)
  .claude/settings.json                  # Claude Code settings
  .claude-plugin/marketplace.json        # Claude Code marketplace
  .agents/plugins/marketplace.json       # Codex CLI marketplace
  .cursor-plugin/marketplace.json        # Cursor marketplace
  .codex/config.toml                     # Codex CLI config
  .github/scripts/                       # repo maintenance scripts
    _helpers.sh                          # shared sync/zip functions
    sync-<vendor>-skills.sh              # per-vendor skill sync
    sync-versions.sh                     # version alignment
    release.sh                           # GitHub release creation
    validate_plugins.py                  # CI plugin validation
  plugins/
    <name>/
      .claude-plugin/plugin.json         # Claude Code manifest
      .codex-plugin/plugin.json          # Codex CLI manifest
      .cursor-plugin/plugin.json         # Cursor manifest
      gemini-extension.json              # Gemini CLI manifest
      skills/<skill>/SKILL.md            # universal across all tools
      agents/<agent>.md                  # Claude Code + Gemini + Cursor
      hooks/hooks.json + scripts/        # Claude Code + Gemini only
      commands/<cmd>.md                  # Claude Code only
```

## Cross-Tool Plugin Format Reference

### Plugin Manifests

Each plugin has 4 manifest files. Claude Code manifest is the source of truth; others are copies or subsets.

| Tool        | Path                                     | Format                                                                  |
| ----------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| Claude Code | `.claude-plugin/plugin.json`             | JSON: name, version, description, author, homepage, repository, license |
| Codex CLI   | `.codex-plugin/plugin.json`              | JSON: same fields as Claude Code                                        |
| Cursor      | `.cursor-plugin/plugin.json`             | JSON: same fields as Claude Code                                        |
| Gemini CLI  | `gemini-extension.json` (at plugin root) | JSON: name, version, description only                                   |

Docs:

- Claude Code: https://code.claude.com/docs/en/plugins-reference
- Codex CLI: https://developers.openai.com/codex/plugins/build/
- Cursor: https://cursor.com/docs/reference/plugins
- Gemini CLI: https://geminicli.com/docs/extensions/reference/
- AGENTS.md spec: https://agents.md/
- Agent Skills spec: https://agentskills.io/specification

### Root Marketplace Files

| Tool        | Path                               | Notes                                                                   |
| ----------- | ---------------------------------- | ----------------------------------------------------------------------- |
| Claude Code | `.claude-plugin/marketplace.json`  | local sources only (use sync scripts for external repos)                |
| Codex CLI   | `.agents/plugins/marketplace.json` | local sources only; use `./`-prefixed `source.path` plus plugin `policy` fields |
| Cursor      | `.cursor-plugin/marketplace.json`  | local sources, needs `source` + `description`                           |
| Gemini CLI  | none                               | per-plugin install: `gemini extensions install --path ./plugins/<name>` |

#### Claude Code marketplace entry

```json
{
  "name": "<plugin-name>",
  "source": "./plugins/<plugin-name>",
  "description": "...",
  "version": "1.0.0",
  "keywords": ["keyword1", "keyword2"],
  "category": "<category>",
  "tags": ["tag1", "tag2"]
}
```

#### Codex CLI marketplace entry

```json
{
  "name": "<plugin-name>",
  "source": { "source": "local", "path": "./plugins/<plugin-name>" },
  "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
  "category": "<category>"
}
```

`source.path` must point to a local folder with a `./`-prefixed path relative to the marketplace root.

`policy.installation` values: `AVAILABLE`, `INSTALLED_BY_DEFAULT`, `NOT_AVAILABLE`.

`policy.authentication` controls whether auth happens on install or first use.

#### Codex CLI personal marketplace example

Use this only for generic Codex marketplace docs and maintainer examples. User-facing installation docs should stay specific to this repo's bundled marketplace.

```json
{
  "name": "personal-plugins",
  "interface": {
    "displayName": "Personal Plugins"
  },
  "plugins": [
    {
      "name": "my-plugin",
      "source": { "source": "local", "path": "./.codex/plugins/my-plugin" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "<category>"
    }
  ]
}
```

Store this at `~/.agents/plugins/marketplace.json`, keep plugin folders under `~/.codex/plugins/`, and keep every `source.path` `./`-prefixed relative to the marketplace root.

#### Cursor marketplace entry

```json
{
  "name": "<plugin-name>",
  "source": "./plugins/<plugin-name>",
  "description": "...",
  "version": "1.0.0"
}
```

### Skills Format

Path: `skills/<name>/SKILL.md`

```yaml
---
name: skill-name
description: This skill should be used when user asks to "do X", "do Y", or "do Z".
---
[skill content - instructions, procedures, guidelines]
```

- `name`: kebab-case, max 64 chars
- `description`: start with "This skill should be used when...", max 1024 chars, include quoted trigger phrases

### Agents Format

Path: `agents/<name>.md`

```yaml
---
name: agent-name
description: |-
  Use this agent when... Examples: <example>...</example>
tools: [Bash, BashOutput, Glob, Grep, Read, Edit, Write]
skills: related-skill-name
model: inherit
color: blue
---
[system prompt - instructions for the agent]
```

- `name`: kebab-case, 3-50 chars
- `model`: inherit, sonnet, opus, haiku
- `color`: blue, cyan, green, yellow, magenta, red
- `tools`: array of allowed tool names
- `skills`: optional, skill name(s) to load

### Hooks Format

Path: `hooks/hooks.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/my_script.py"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if the command is safe before proceeding."
          }
        ]
      }
    ]
  }
}
```

Events: PreToolUse, PostToolUse, Stop, SubagentStop, SessionStart, SessionEnd, UserPromptSubmit, PreCompact, Notification.

Hook types:

- `command`: runs a script. Script reads JSON from stdin, exit 0 = pass, exit 2 = block.
- `prompt`: injects a prompt into the conversation.

Use `${CLAUDE_PLUGIN_ROOT}` for script paths. `matcher` matches tool names (e.g., "Edit", "Bash", "mcp**tavily**tavily_search").

### Commands Format

Path: `commands/<name>.md`

```yaml
---
allowed-tools: Read, Bash, Edit
description: Brief description of what this command does
argument-hint: optional argument hint
---
[command instructions - what to do when this command is invoked]
```

Commands are Claude Code only. Gemini CLI uses TOML commands. Other tools use skills for similar functionality.

### Component Portability

| Component                         | Claude Code | Codex CLI   | Gemini CLI  | Cursor  |
| --------------------------------- | ----------- | ----------- | ----------- | ------- |
| Skills (`skills/<name>/SKILL.md`) | native      | native      | native      | native  |
| Agents (`agents/<name>.md`)       | native      | config.toml | preview     | native  |
| Hooks (`hooks/hooks.json`)        | native      | no          | native      | partial |
| Commands (`commands/<name>.md`)   | native (MD) | no          | TOML format | no      |

### Installation

```
Claude Code: /plugin marketplace add fcakyon/claude-codex-settings
Codex CLI:   use .agents/plugins/marketplace.json or ~/.agents/plugins/marketplace.json, restart Codex, then install from /plugins
Cursor:      import marketplace or /add-plugin
Gemini CLI:  gemini extensions install --path ./plugins/<name>
```

## Adding a New Plugin

1. Create `plugins/<name>/` with at minimum `skills/<skill-name>/SKILL.md`
2. Create `.claude-plugin/plugin.json`:
   ```json
   {
     "name": "<name>",
     "version": "1.0.0",
     "description": "...",
     "homepage": "https://github.com/fcakyon/claude-codex-settings#plugins",
     "repository": "https://github.com/fcakyon/claude-codex-settings",
     "license": "Apache-2.0"
   }
   ```
3. Copy `.claude-plugin/plugin.json` to `.codex-plugin/plugin.json` and `.cursor-plugin/plugin.json`
4. Create `gemini-extension.json` at plugin root with `{name, version, description}` only
5. Add entry to `.claude-plugin/marketplace.json` (Claude Code)
6. Add entry to `.agents/plugins/marketplace.json` (Codex CLI)
7. Add entry to `.cursor-plugin/marketplace.json` (Cursor)
8. Run `/claude-tools:update-readme` to regenerate plugin sections and ZIP links in README.md
9. Add sync script command to `CLAUDE.md` syncing vendor skills section (if synced plugin)
10. Update `README.md` TODO section if the plugin was listed there

## Marketplace Plugin Conventions

### Source Types in Claude Code `marketplace.json`

All plugins use local sources: `"source": "./plugins/<plugin-name>"`. For external vendor skills, use sync scripts (`.github/scripts/sync-<name>-skills.sh`) to fetch and copy skills locally rather than referencing remote URLs.

### plugin.json fields

Local plugins use: `name`, `version`, `description`, `homepage`, `repository`, `license`. Author is optional (skip for third-party plugins).

### SKILL.md frontmatter

Two fields: `name` and `description`. Description should start with "This skill should be used when..." with quoted trigger phrases.

### Marketplace entry fields

Rich metadata (`keywords`, `category`, `tags`) lives in `marketplace.json`, not in individual `plugin.json` files. Never use vendor names in tags or keywords.

## Documentation Rules

When writing README or docs content for this repo:

- Assume users have limited knowledge about plugins, skills, and marketplaces
- Keep the learning curve low: brief plain-language explanations before install commands
- Each plugin section should explain WHAT it does and WHY a developer would want it, not just list components
- Use behavior-oriented language: "auto-formats your Python code after every edit" instead of "PostToolUse hook running ruff on Write/Edit events"
- Avoid jargon like "frontmatter", "manifest", "PostToolUse hooks" in user-facing docs
- Installation instructions must be copy-paste ready
- Plan for future before/after GIFs or demos per plugin to show value visually

## Commit and PR Writing Style

This repo contains config files (JSON settings, allowlist rules, hooks) rather than application code. Commit messages and PR descriptions should be written in plain language that anyone can understand, not just Claude Code plugin developers.

- Describe WHAT changed and WHY in everyday terms: "add a safety hook that flags dangerous shell commands for review" not "add PreToolUse command hook with regex matcher on Bash tool"
- Avoid internal jargon: say "allowlist" not "permissions allowlist entries", say "settings files" not "settings.json/settings-minimax.json/settings-zai.json"
- When listing affected files, group by purpose: "all 3 settings files" instead of naming each one
- Keep PR bodies short: 2-3 bullet points explaining the user-visible behavior change

## Maintenance Scripts

Scripts in `.github/scripts/` for repo maintenance. Run from repo root.

### Syncing vendor skills

Per-vendor scripts sync official agent-skills repos into local plugins:

- `_helpers.sh` — shared functions (clone/update, copy, zip)
- `sync-<name>-skills.sh` — per-vendor: clone repo to ~/dev/, copy SKILL.md + subdirs, create zip

```bash
bash .github/scripts/sync-mongodb-skills.sh
bash .github/scripts/sync-supabase-skills.sh
bash .github/scripts/sync-supabase-js-skills.sh
bash .github/scripts/sync-supabase-cli-skills.sh
bash .github/scripts/sync-stripe-skills.sh
bash .github/scripts/sync-polar-skills.sh
bash .github/scripts/sync-livekit-skills.sh
bash .github/scripts/sync-react-skills.sh
bash .github/scripts/sync-agent-browser-skills.sh
bash .github/scripts/sync-anthropic-office-skills.sh
bash .github/scripts/sync-openai-office-skills.sh
bash .github/scripts/sync-cloudflare-skills.sh
bash .github/scripts/sync-web-performance-skills.sh
bash .github/scripts/sync-hetzner-skills.sh
bash .github/scripts/sync-dokploy-skills.sh
```

Adding a new vendor: create `sync-<name>-skills.sh`, source `_helpers.sh`, list repos + skill paths.

### Version alignment

`.claude-plugin/plugin.json` is the source of truth for each plugin's version. Run after bumping:

```bash
bash .github/scripts/sync-versions.sh
```

Propagates version to `.codex-plugin/`, `.cursor-plugin/`, `gemini-extension.json`, and marketplace entries. CI validates alignment on every PR.

### Releases

```bash
bash .github/scripts/release.sh <version>
```

Updates marketplace version, uploads skill zips as artifacts, generates release notes from README + auto-changelog.

### README updates

`/claude-tools:update-readme` regenerates plugin sections and zip download links in README.
