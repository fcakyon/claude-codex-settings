import type { APIRoute } from "astro";
import { plugins, repositoryUrl, site } from "../lib/content";

export const prerender = true;

export const GET: APIRoute = () => {
  const body = site.variant === "settings"
    ? `# Claude Settings

> ${site.description}

## Primary resources

- [Website](${site.url}): Configuration overview and interactive source-file viewer.
- [Full LLM context](${site.url}/llms-full.txt): Current repository configuration and installation content.
- [GitHub repository](${repositoryUrl}): Source files, plugins and installation instructions.
- [Installation guide](${repositoryUrl}/blob/main/INSTALL.md): Tool prerequisites and setup commands.

## Plugin catalog

- [Agent Plugins](https://agentplugins.net): Searchable plugin and skill directory.
`
    : `# Agent Plugins

> ${site.description}

## Primary resources

- [Plugin directory](${site.url}): Search and inspect the current plugin catalog.
- [Full LLM context](${site.url}/llms-full.txt): Current plugin names, descriptions, support and source links.
- [GitHub repository](${repositoryUrl}): Source files and installation instructions.

## Featured plugins

${plugins.slice(0, 8).map((plugin) => `- [${plugin.name}](${plugin.href}): ${plugin.description}`).join("\n")}
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
