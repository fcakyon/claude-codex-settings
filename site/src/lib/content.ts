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
export const author = {
  id: "https://github.com/fcakyon",
  name: "Fatih C. Akyon",
  alternateName: "Fatih Akyon",
  xHandle: "@fcakyon",
  profiles: {
    GitHub: "https://github.com/fcakyon",
    X: "https://x.com/fcakyon",
    LinkedIn: "https://www.linkedin.com/in/fcakyon",
  },
};
export const site = {
  settings: {
    variant: "settings" as const,
    url: process.env.PUBLIC_SITE_URL || "https://claudesettings.com",
  },
  plugins: {
    variant: "plugins" as const,
    url: process.env.PUBLIC_SITE_URL || "https://agentplugins.net",
  },
}[variant];

const editorDirectories = [
  {
    name: ".claude",
    tool: "Claude Code",
    files: [
      "CLAUDE.md",
      ...readdirSync(resolve(root, ".claude"))
        .filter((name) => /^settings(?:-[^.]+)?\.json$/.test(name))
        .sort((a, b) => Number(a !== "settings.json") - Number(b !== "settings.json") || a.localeCompare(b)),
    ],
  },
  {
    name: ".codex",
    tool: "Codex CLI",
    files: readdirSync(resolve(root, ".codex"))
      .filter((name) => /^config(?:-[^.]+)?\.toml$/.test(name))
      .sort((a, b) => Number(a !== "config.toml") - Number(b !== "config.toml") || a.localeCompare(b)),
  },
] as const;

export const editorGroups = editorDirectories.map((directory) => ({
  ...directory,
  files: directory.files.map((label) => {
    const path = `${directory.name}/${label}`;
    const provider = label.match(/^(?:settings|config)-([^.]+)\./)?.[1];
    return {
      id: path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, ""),
      label,
      path,
      tool: directory.tool,
      provider,
      content: read(path),
      focus:
        label === "CLAUDE.md"
          ? "## Core Principles"
          : provider
            ? label.endsWith(".json")
              ? '"ANTHROPIC_BASE_URL"'
              : "model ="
            : label.endsWith(".json")
              ? '"env"'
              : "[plugins.",
      language: label.endsWith(".md") ? "markdown" : label.endsWith(".json") ? "json" : "toml",
      url: `${repositoryUrl}/blob/main/${path}`,
    };
  }),
}));

export const editorFiles = editorGroups.flatMap((group) => group.files);
export const configurationDocuments = editorFiles.filter((file) => file.label !== "CLAUDE.md");

const providerLabels: Record<string, string> = { kimi: "Kimi", minimax: "MiniMax", zai: "Z.ai / GLM" };

export const providerNames = [
  ...new Set(
    configurationDocuments.flatMap(({ provider }) => (provider ? [providerLabels[provider] || provider] : [])),
  ),
];

const marketplaceSlug = repositoryUrl.replace("https://github.com/", "");

let starsRequest: Promise<number | null> | undefined;

export const repositoryStars = () => {
  starsRequest ||= fetch(`https://api.github.com/repos/${marketplaceSlug}`, {
    signal: AbortSignal.timeout(8000),
    headers: {
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((repository) => (repository?.stargazers_count as number) ?? null)
    .catch(() => null);
  return starsRequest;
};

const marketplace = JSON.parse(read(".claude-plugin/marketplace.json")) as Marketplace;
const codexPlugins = new Set(
  (JSON.parse(read(".agents/plugins/marketplace.json")) as Marketplace).plugins.map((plugin) => plugin.name),
);
const cursorPlugins = new Set(
  (JSON.parse(read(".cursor-plugin/marketplace.json")) as Marketplace).plugins.map((plugin) => plugin.name),
);
export const featured = ["simplify", "humanize", "codex-advisor", "fable-advisor", "adhd-output-style"];
const componentNames = (directory: string, folder: string, skill = false) => {
  const path = resolve(directory, folder);
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) =>
      skill
        ? entry.isDirectory() && existsSync(resolve(path, entry.name, "SKILL.md"))
        : entry.isFile() && extname(entry.name) === ".md",
    )
    .map((entry) => (skill ? entry.name : basename(entry.name, ".md")))
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
    const externalUrl =
      typeof plugin.source === "object"
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
    return (
      (aFeatured < 0 ? featured.length + a.index : aFeatured) - (bFeatured < 0 ? featured.length + b.index : bFeatured)
    );
  });

export const codingTools = [
  {
    id: "claude",
    icon: "claude",
    label: "Claude Code",
    marketplace: `claude plugin marketplace add ${marketplaceSlug}`,
  },
  { id: "codex", icon: "openai", label: "Codex CLI", marketplace: `codex plugin marketplace add ${marketplaceSlug}` },
  { id: "cursor", icon: "cursor", label: "Cursor", marketplace: undefined },
  { id: "gemini", icon: "gemini", label: "Gemini CLI", marketplace: undefined },
] as const;

export const sourceDocuments = {
  claude: read(".claude/CLAUDE.md"),
  install: read("INSTALL.md"),
};
