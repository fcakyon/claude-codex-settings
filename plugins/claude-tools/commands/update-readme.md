---
allowed-tools: Read, Glob, Grep, Edit
description: Update README.md plugin sections and download links
---

# Update README.md

Regenerate the Plugins section of README.md based on current plugin structure and marketplace data.

## Steps

1. Read `.claude-plugin/marketplace.json` to get the full list of plugins with descriptions, versions, and metadata.

2. For each plugin, scan `plugins/<name>/` to discover:
   - Skills: `plugins/<name>/skills/*/SKILL.md`
   - Commands: `plugins/<name>/commands/*.md`
   - Agents: `plugins/<name>/agents/*.md`
   - Hooks: `plugins/<name>/hooks/hooks.json`
   - MCP: `plugins/<name>/.mcp.json`

3. Update each plugin's `<details>` block in README.md. Use this format:

```markdown
<details>
<summary><strong>plugin-name</strong> - Short description</summary>

| Claude Code                                   | Codex CLI                                          | Gemini CLI                                               |
| --------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `/plugin install plugin-name@claude-settings` | `codex plugin install plugin-name@claude-settings` | `gemini extensions install --path ./plugins/plugin-name` |

One-line description.

**Skills:**

- [`skill-name`](./plugins/plugin-name/skills/skill-name/SKILL.md) - Description from SKILL.md frontmatter

**Commands:** (if any)

- [`/plugin-name:cmd`](./plugins/plugin-name/commands/cmd.md) - Description from frontmatter

**Agents:** / **Hooks:** / **MCP:** (if applicable)

</details>
```

4. For skill-only plugins (no MCP, no commands), add green download badges for each skill zip:

```markdown
[![Download ZIP](https://img.shields.io/badge/⬇%20Download%20ZIP-skill--name-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/skill-name.zip)
```

5. Also update the Installation section if plugin names have changed.

6. Do NOT modify non-plugin sections (header, Configuration, Statusline, TODO, References, Star History).
