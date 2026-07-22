import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

export type SiteVariant = "settings" | "plugins";

interface MarketplacePlugin {
  name: string;
  source: string | { path?: string; url: string };
  description: string;
  version: string;
  license?: string;
  keywords?: string[];
  category?: string;
  tags?: string[];
}

interface Marketplace {
  plugins: MarketplacePlugin[];
}

const root = resolve(process.cwd(), "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const variant = (process.env.SITE_VARIANT || "settings") as SiteVariant;

export const repositoryUrl = "https://github.com/fcakyon/claude-codex-settings";
export const rawRepositoryUrl = `${repositoryUrl.replace("github.com", "raw.githubusercontent.com")}/main`;
export const marketplaceName = "claude-settings";
export const site = {
  settings: {
    variant: "settings" as const,
    url: process.env.PUBLIC_SITE_URL || "https://claudesettings.com",
    title: "Claude Settings for Claude Code, Codex and Cursor",
    description:
      "Battle-tested settings, skills, hooks and agents for Claude Code, OpenAI Codex, Cursor and Gemini.",
  },
  plugins: {
    variant: "plugins" as const,
    url: process.env.PUBLIC_SITE_URL || "https://agentplugins.net",
    title: "Agent Plugins for Claude Code, Codex, Cursor and Gemini",
    description:
      "Browse installable skills, hooks and agents for Claude Code, OpenAI Codex, Cursor and Gemini.",
  },
}[variant];

const claudeContent = read(".claude/CLAUDE.md");
const settingsContent = read(".claude/settings.json");

export const editorFiles = [
  {
    id: "claude",
    label: "CLAUDE.md",
    content: claudeContent,
    focus: "## Core Principles",
  },
  {
    id: "agents",
    label: "AGENTS.md",
    content: read("AGENTS.md"),
    focus: "## Repo Structure",
  },
  {
    id: "settings",
    label: "settings.json",
    content: settingsContent,
    focus: '"env"',
  },
];

const marketplace = JSON.parse(read(".claude-plugin/marketplace.json")) as Marketplace;
const codexPlugins = new Set((JSON.parse(read(".agents/plugins/marketplace.json")) as Marketplace).plugins.map((plugin) => plugin.name));
const cursorPlugins = new Set((JSON.parse(read(".cursor-plugin/marketplace.json")) as Marketplace).plugins.map((plugin) => plugin.name));
const featured = ["simplify", "humanize", "fable-advisor", "adhd-output-style"];
const componentNames = (directory: string, folder: string, skill = false) => {
  const path = resolve(directory, folder);
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => skill
      ? entry.isDirectory() && existsSync(resolve(path, entry.name, "SKILL.md"))
      : entry.isFile() && extname(entry.name) === ".md")
    .map((entry) => skill ? entry.name : basename(entry.name, ".md"))
    .sort();
};

export const plugins = marketplace.plugins
  .map((plugin, index) => {
    const localSource = typeof plugin.source === "string" ? plugin.source : undefined;
    const directory = localSource ? resolve(root, localSource) : undefined;
    const hasCodex = codexPlugins.has(plugin.name);
    const hasCursor = cursorPlugins.has(plugin.name);
    const hasGemini = Boolean(directory && existsSync(resolve(directory, "gemini-extension.json")));
    const tools = [
      "Claude Code",
      ...(hasCodex ? ["Codex"] : []),
      ...(hasCursor ? ["Cursor"] : []),
      ...(hasGemini ? ["Gemini"] : []),
    ];
    const externalUrl = typeof plugin.source === "object"
      ? `${plugin.source.url.replace(/\.git$/, "")}${plugin.source.path ? `/tree/main/${plugin.source.path}` : ""}`
      : undefined;
    const components = directory
      ? {
          skills: componentNames(directory, "skills", true),
          commands: componentNames(directory, "commands"),
          agents: [...componentNames(directory, "agents"), ...componentNames(directory, "claude-agents")].sort(),
          hooks: existsSync(resolve(directory, "hooks")) || existsSync(resolve(directory, "claude-hooks")),
          mcp: existsSync(resolve(directory, ".mcp.json")),
          outputStyles: componentNames(directory, "output-styles"),
        }
      : undefined;

    return {
      ...plugin,
      index,
      tools,
      components,
      href: localSource ? `${repositoryUrl}/tree/main/${localSource.replace(/^\.\//, "")}` : externalUrl,
      claudeCommand: `claude plugin install ${plugin.name}@${marketplaceName}`,
      codexCommand: hasCodex ? `codex plugin add ${plugin.name}@${marketplaceName}` : undefined,
      cursorCommand: hasCursor ? `cursor plugin install ${plugin.name}@${marketplaceName}` : undefined,
      geminiCommand: hasGemini ? `gemini extensions install --path ./plugins/${plugin.name}` : undefined,
    };
  })
  .sort((a, b) => {
    const aFeatured = featured.indexOf(a.name);
    const bFeatured = featured.indexOf(b.name);
    return (aFeatured < 0 ? featured.length + a.index : aFeatured) -
      (bFeatured < 0 ? featured.length + b.index : bFeatured);
  });

export const sourceDocuments = {
  claude: claudeContent,
  settings: settingsContent,
  codex: read(".codex/config.toml"),
  install: read("INSTALL.md"),
};
