import type { APIRoute } from "astro";
import { plugins, repositoryUrl, site, sourceDocuments } from "../lib/content";

export const prerender = true;

export const GET: APIRoute = () => {
  const body = site.variant === "settings"
    ? `# Claude Settings

Source: ${repositoryUrl}

## .claude/CLAUDE.md

${sourceDocuments.claude}

## .claude/settings.json

\`\`\`json
${sourceDocuments.settings}
\`\`\`

## INSTALL.md

${sourceDocuments.install}
`
    : `# Agent Plugins

Source: ${repositoryUrl}

${plugins.map((plugin) => `## ${plugin.name}

${plugin.description}

- Supported tools: ${plugin.tools.join(", ")}
- Source: ${plugin.href}
${plugin.codexCommand ? `- Codex install: \`${plugin.codexCommand}\`` : ""}
`).join("\n")}`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
