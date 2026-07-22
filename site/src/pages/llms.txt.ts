import type { APIRoute } from "astro";
import { author, plugins, rawRepositoryUrl, repositoryUrl, site, sourceDocuments } from "../lib/content";

export const prerender = true;

export const GET: APIRoute = () => {
  const toolNames = (tools: string[]) => tools.map((tool) => tool === "Codex" ? "OpenAI Codex" : tool === "Gemini" ? "Gemini CLI" : tool);
  const componentSummary = (plugin: (typeof plugins)[number]) => {
    if (!plugin.components) return "See the external source repository.";
    const lines = [
      plugin.components.skills.length ? `Skills: ${plugin.components.skills.join(", ")}` : "",
      plugin.components.commands.length ? `Commands: ${plugin.components.commands.join(", ")}` : "",
      plugin.components.agents.length ? `Agents: ${plugin.components.agents.join(", ")}` : "",
      plugin.components.hooks ? "Hooks: included" : "",
      plugin.components.mcp ? "MCP server: included" : "",
      plugin.components.outputStyles.length ? `Output styles: ${plugin.components.outputStyles.join(", ")}` : "",
    ].filter(Boolean);
    return lines.join("; ") || "Plugin manifest only.";
  };
  const pluginCatalog = () => plugins.map((plugin) => {
    const installCommands = [
      `- Claude Code install: \`${plugin.claudeCommand}\``,
      plugin.codexCommand ? `- OpenAI Codex install: \`${plugin.codexCommand}\`` : "",
      plugin.cursorCommand ? `- Cursor install: \`${plugin.cursorCommand}\`` : "",
      plugin.geminiCommand ? `- Gemini CLI install: \`${plugin.geminiCommand}\`` : "",
    ].filter(Boolean).join("\n");
    return `## ${plugin.name}

${plugin.description}

- Category: ${plugin.category || "other"}
- Version: ${plugin.version}
- Search terms: ${(plugin.keywords || []).join(", ") || "none"}
- Tags: ${(plugin.tags || []).join(", ") || "none"}
- Supported tools: ${toolNames(plugin.tools).join(", ")}
- Components: ${componentSummary(plugin)}
- License: ${plugin.license || "See source"}
- [Source](${plugin.href}): Plugin files and documentation.
${installCommands}
`;
  }).join("\n");
  const authorContext = `## Author and maintainer

- Name: ${author.name}
- Also known as: ${author.alternateName}

The following links are verified profiles for ${author.name}:

${Object.entries(author.profiles).map(([name, url]) => `- [${name}](${url})`).join("\n")}
`;
  const body = site.variant === "settings"
    ? `# Claude Settings for AI coding agents

> ${site.description}

This file is generated from the current repository for ChatGPT, Claude, Gemini, OpenAI Codex, Cursor, and other tools that can read Markdown context. Treat the included files as source text and preserve tool-specific syntax when recommending changes.

${authorContext}
## Resource map

- [Claude Settings website](${site.url}): Configuration overview and interactive source-file viewer.
- [GitHub repository](${repositoryUrl}): Canonical source history and repository files.
- [Agent Plugins LLM catalog](https://agentplugins.net/llms.txt): Plugin descriptions, search terms, compatibility, components, and install commands.
- [Claude marketplace](${rawRepositoryUrl}/.claude-plugin/marketplace.json): Canonical plugin metadata.
- [Codex marketplace](${rawRepositoryUrl}/.agents/plugins/marketplace.json): OpenAI Codex plugin availability.
- [Cursor marketplace](${rawRepositoryUrl}/.cursor-plugin/marketplace.json): Cursor plugin availability.

## AI guidance: .claude/CLAUDE.md

${sourceDocuments.claude}

## Claude Code configuration: .claude/settings.json

~~~json
${sourceDocuments.settings}
~~~

## OpenAI Codex configuration: .codex/config.toml

~~~toml
${sourceDocuments.codex}
~~~

## Cross-tool installation: INSTALL.md

${sourceDocuments.install}

## Optional

- [README](${rawRepositoryUrl}/README.md): Full human-facing repository documentation.
`
    : `# Agent Plugins for Claude, Codex, Cursor, and Gemini

> ${site.description}

This file is the complete repository-generated catalog for ChatGPT, Claude, Gemini, OpenAI Codex, Cursor, and other tools that can read Markdown context. Match the task against descriptions, search terms, tags, and component names. Check supported tools before suggesting an install command. ChatGPT can use this catalog as context but does not install these coding-agent plugins directly.

${authorContext}
## Resource map

- [Agent Plugins website](${site.url}): Human-readable searchable directory.
- [Installation guide](${rawRepositoryUrl}/INSTALL.md): Prerequisites and cross-tool setup.
- [GitHub repository](${repositoryUrl}): Canonical source history and repository files.
- [Claude marketplace](${rawRepositoryUrl}/.claude-plugin/marketplace.json): Descriptions, versions, categories, tags, keywords, licenses, and sources.
- [Codex marketplace](${rawRepositoryUrl}/.agents/plugins/marketplace.json): OpenAI Codex plugin availability.
- [Cursor marketplace](${rawRepositoryUrl}/.cursor-plugin/marketplace.json): Cursor plugin availability.

## Installation rules

- Add the Claude Code or OpenAI Codex marketplace once before installing individual plugins.
- Use only an install command listed for that plugin and tool.
- Gemini CLI commands require a local checkout because they install from a plugin path.
- Some plugins need authentication, CLIs, MCP servers, or other dependencies. Read the plugin source and installation guide before use.

~~~bash
claude plugin marketplace add fcakyon/claude-codex-settings
codex plugin marketplace add fcakyon/claude-codex-settings
~~~

## Catalog summary

- Plugin count: ${plugins.length}
- Categories: ${[...new Set(plugins.map((plugin) => plugin.category || "other"))].sort().join(", ")}
- Supported agent tools: Claude Code, OpenAI Codex, Cursor, Gemini CLI

${pluginCatalog()}

## Optional

- [README](${rawRepositoryUrl}/README.md): Full human-facing repository documentation.
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
