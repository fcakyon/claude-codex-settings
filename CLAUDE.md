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

| Tool | Path | Format |
|------|------|--------|
| Claude Code | `.claude-plugin/plugin.json` | JSON: name, version, description, author, homepage, repository, license |
| Codex CLI | `.codex-plugin/plugin.json` | JSON: same fields as Claude Code |
| Cursor | `.cursor-plugin/plugin.json` | JSON: same fields as Claude Code |
| Gemini CLI | `gemini-extension.json` (at plugin root) | JSON: name, version, description only |

Docs:
- Claude Code: https://code.claude.com/docs/en/plugins-reference
- Codex CLI: https://developers.openai.com/codex/plugins/build/
- Cursor: https://cursor.com/docs/reference/plugins
- Gemini CLI: https://geminicli.com/docs/extensions/reference/
- AGENTS.md spec: https://agents.md/

### Root Marketplace Files

| Tool | Path | Notes |
|------|------|-------|
| Claude Code | `.claude-plugin/marketplace.json` | local, URL, and git-subdir sources |
| Codex CLI | `.agents/plugins/marketplace.json` | local sources only, needs `policy.installation` |
| Cursor | `.cursor-plugin/marketplace.json` | local sources, needs `source` + `description` |
| Gemini CLI | none | per-plugin install: `gemini extensions install --path ./plugins/<name>` |

#### Claude Code marketplace entry

```json
{
  "name": "<plugin-name>",
  "source": "./plugins/<plugin-name>",
  "description": "...",
  "version": "1.0.0",
  "keywords": ["keyword1", "keyword2"],
  "category": "development",
  "tags": ["tag1", "tag2"]
}
```

#### Codex CLI marketplace entry

```json
{
  "name": "<plugin-name>",
  "source": { "source": "local", "path": "./plugins/<plugin-name>" },
  "policy": { "installation": "AVAILABLE" },
  "category": "Development"
}
```

`policy.installation` values: `AVAILABLE`, `INSTALLED_BY_DEFAULT`, `NOT_AVAILABLE`.

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
- `description`: start with "This skill should be used when...", max 600 chars, include quoted trigger phrases

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

Use `${CLAUDE_PLUGIN_ROOT}` for script paths. `matcher` matches tool names (e.g., "Edit", "Bash", "mcp__tavily__tavily_search").

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

| Component | Claude Code | Codex CLI | Gemini CLI | Cursor |
|-----------|------------|-----------|------------|--------|
| Skills (`skills/<name>/SKILL.md`) | native | native | native | native |
| Agents (`agents/<name>.md`) | native | config.toml | preview | native |
| Hooks (`hooks/hooks.json`) | native | no | native | partial |
| Commands (`commands/<name>.md`) | native (MD) | no | TOML format | no |

### Installation

```
Claude Code: /plugin marketplace add fcakyon/claude-codex-settings
Codex CLI:   codex plugin install <plugin-name>@claude-settings
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

## Marketplace Plugin Conventions

### Source Types in Claude Code `marketplace.json`

- **Local path**: `"source": "./plugins/my-plugin"` for plugins in this repo
- **URL source**: `"source": { "source": "url", "url": "https://github.com/owner/repo.git" }` for external repos (use this over `github` source)
- **Git subdir**: `"source": { "source": "git-subdir", "url": "https://github.com/owner/repo.git", "path": "plugins/subdir" }` for a single plugin inside a monorepo

### Cherry-picking skills from external repos

Use `strict: false` + explicit `skills` array to expose only specific skills from an external repo:

```json
{
  "source": { "source": "url", "url": "https://github.com/owner/repo.git" },
  "strict": false,
  "skills": ["./skills/skill-a", "./skills/skill-b"]
}
```

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
