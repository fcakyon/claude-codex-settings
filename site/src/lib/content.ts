import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, relative, resolve } from "node:path";
import { load } from "js-yaml";
import catalogSeo from "./catalog-seo.json";
import { releaseDownloads } from "./downloads";

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
    name: "Claude Settings",
    url: process.env.PUBLIC_SITE_URL || "https://claudesettings.com",
  },
  plugins: {
    variant: "plugins" as const,
    name: "Agent Plugins",
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
export const claudeGuideFile = editorFiles.find((file) => file.label === "CLAUDE.md")!;

export const providerLabels: Record<string, string> = { kimi: "Kimi", minimax: "MiniMax", zai: "Z.ai / GLM" };

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

export const [downloadStats] = await Promise.all([releaseDownloads(marketplaceSlug), repositoryStars()]);

const marketplace = JSON.parse(read(".claude-plugin/marketplace.json")) as Marketplace;
const codexPlugins = new Set(
  (JSON.parse(read(".agents/plugins/marketplace.json")) as Marketplace).plugins.map((plugin) => plugin.name),
);
const cursorPlugins = new Set(
  (JSON.parse(read(".cursor-plugin/marketplace.json")) as Marketplace).plugins.map((plugin) => plugin.name),
);
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

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
    const seo = catalogSeo.plugins[plugin.name as keyof typeof catalogSeo.plugins];
    if (!seo) throw new Error(`Missing public plugin metadata: ${plugin.name}`);
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
    const claudeCommand = `claude plugin install ${plugin.name}@${marketplaceName}`;
    const codexCommand = hasCodex ? `codex plugin add ${plugin.name}@${marketplaceName}` : undefined;
    const cursorCommand = hasCursor ? `cursor-agent # enter /plugin, then install ${plugin.name}` : undefined;
    const geminiCommand = hasGemini ? `gemini extensions install --path ./plugins/${plugin.name}` : undefined;
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
      seo,
      description: seo.description,
      index,
      tools,
      components,
      summary: [
        components?.skills.length && plural(components.skills.length, "skill"),
        components?.agents.length && plural(components.agents.length, "agent"),
        components?.commands.length && plural(components.commands.length, "command"),
        components?.outputStyles.length && plural(components.outputStyles.length, "output style"),
        components?.hooks && "hooks",
        components?.mcp && "MCP server",
      ]
        .filter(Boolean)
        .join(", "),
      search: [
        plugin.name,
        seo.description,
        plugin.category,
        ...(plugin.keywords || []),
        ...(plugin.tags || []),
        ...(components?.skills || []),
        ...(components?.commands || []),
        ...(components?.agents || []),
        ...(components?.outputStyles || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      href: localSource ? `${repositoryUrl}/tree/main/${localSource.replace(/^\.\//, "")}` : externalUrl,
      claudeCommand,
      codexCommand,
      cursorCommand,
      geminiCommand,
      installCommands: [
        {
          id: "claude",
          icon: "claude",
          tool: "Claude Code",
          command: claudeCommand,
        },
        ...(codexCommand
          ? [
              {
                id: "codex",
                icon: "openai",
                tool: "OpenAI Codex",
                command: codexCommand,
              },
            ]
          : []),
        ...(cursorCommand
          ? [
              {
                id: "cursor",
                icon: "cursor",
                tool: "Cursor",
                command: cursorCommand,
              },
            ]
          : []),
        ...(geminiCommand
          ? [
              {
                id: "gemini",
                icon: "gemini",
                tool: "Gemini CLI",
                command: geminiCommand,
              },
            ]
          : []),
      ],
    };
  })
  .sort((a, b) => {
    const aFeatured = featured.indexOf(a.name);
    const bFeatured = featured.indexOf(b.name);
    return (
      (aFeatured < 0 ? featured.length + a.index : aFeatured) - (bFeatured < 0 ? featured.length + b.index : bFeatured)
    );
  });

export type Plugin = (typeof plugins)[number];
export const pluginByName = new Map(plugins.map((plugin) => [plugin.name, plugin]));

const skillFiles = (directory: string, base = directory): string[] =>
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith(".") && extname(entry.name) !== ".zip")
    .flatMap((entry) =>
      entry.isDirectory()
        ? skillFiles(resolve(directory, entry.name), base)
        : [relative(base, resolve(directory, entry.name))],
    )
    .sort((a, b) => Number(a !== "SKILL.md") - Number(b !== "SKILL.md") || a.localeCompare(b));

// Second-level headings outside code fences, as plain text.
const sectionHeadings = (markdown: string) => {
  let fenced = false;
  return markdown.split("\n").flatMap((line) => {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    return !fenced && line.startsWith("## ")
      ? [line.slice(3).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[`*]/g, "").replace(/\s+[—–]\s+/g, ": ").trim()]
      : [];
  });
};

const duplicateSkillNames = new Set(
  plugins
    .flatMap((plugin) => plugin.components?.skills || [])
    .filter((name, _, names) => names.indexOf(name) !== names.lastIndexOf(name)),
);
export const skills = plugins
  .flatMap((plugin) =>
    (plugin.components?.skills || []).map((name) => {
      const key = `${plugin.name}/${name}`;
      const path = `plugins/${plugin.name}/skills/${name}`;
      const [, frontmatter, body] = read(`${path}/SKILL.md`).match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || [];
      const { description } = (load(frontmatter || "") || {}) as { description?: string };
      if (!description) throw new Error(`Missing SKILL.md description: ${key}`);
      const assetPlugin = plugin.name.endsWith("-office-skills")
        ? plugin.name.replace(/-office-skills$/, "")
        : plugin.name;
      const asset = `${duplicateSkillNames.has(name) ? `${assetPlugin}-${name}` : name}.zip`;
      const seo = catalogSeo.skills[key as keyof typeof catalogSeo.skills];
      if (!seo) throw new Error(`Missing public skill metadata: ${key}`);
      return {
        key,
        name,
        plugin: plugin.name,
        category: plugin.category,
        asset,
        downloads: downloadStats.assets[asset]?.count || 0,
        downloadUrl: downloadStats.assets[asset]?.url,
        sourceUrl: `${repositoryUrl}/tree/main/${path}`,
        trigger: description.trim(),
        sections: sectionHeadings(body),
        files: skillFiles(resolve(root, path)).map((file) => ({ path: file, url: `${repositoryUrl}/blob/main/${path}/${file}` })),
        seo,
        detailUrl: `/plugins/${plugin.name}/skills/${name}/`,
        search: [name, plugin.name, plugin.category, seo.title, seo.description].filter(Boolean).join(" ").toLowerCase(),
      };
    }),
  )
  .sort((a, b) => a.name.localeCompare(b.name) || a.plugin.localeCompare(b.plugin));

export type Skill = (typeof skills)[number];
export const popularSkills = skills.toSorted((a, b) => b.downloads - a.downloads);
export const skillByKey = new Map(skills.map((skill) => [skill.key, skill]));
export const skillsByPlugin = Object.groupBy(skills, (skill) => skill.plugin);

export const contentPages = [
  { path: "plugins", kind: "pluginHub" as const, sitemap: "plugins" },
  { path: "skills", kind: "skillHub" as const, sitemap: "skills" },
  { path: "settings", kind: "settingsHub" as const, sitemap: "settings" },
  { path: "settings/claude-code", kind: "configuration" as const, configuration: "claude-code", sitemap: "settings" },
  { path: "settings/codex", kind: "configuration" as const, configuration: "codex", sitemap: "settings" },
  { path: "settings/providers/kimi", kind: "provider" as const, provider: "kimi", sitemap: "settings" },
  { path: "settings/providers/minimax", kind: "provider" as const, provider: "minimax", sitemap: "settings" },
  { path: "settings/providers/zai", kind: "provider" as const, provider: "zai", sitemap: "settings" },
  { path: "guides/claude-md", kind: "claudeGuide" as const, sitemap: "guides" },
  { path: "guides/install-agent-skills", kind: "installGuide" as const, sitemap: "guides" },
  ...plugins.map((plugin) => ({
    path: `plugins/${plugin.name}`,
    kind: "plugin" as const,
    plugin: plugin.name,
    sitemap: "plugins",
  })),
  ...skills.map((skill) => ({
    path: `plugins/${skill.plugin}/skills/${skill.name}`,
    kind: "skill" as const,
    skill: skill.key,
    sitemap: "skills",
  })),
];

export type ContentPage = (typeof contentPages)[number];
export const sitemapGroups = ["core", ...new Set(contentPages.map(({ sitemap }) => sitemap))];

export const codingTools = [
  {
    id: "claude",
    icon: "claude",
    label: "Claude Code",
    marketplace: `claude plugin marketplace add ${marketplaceSlug}`,
  },
  { id: "codex", icon: "openai", label: "Codex CLI", marketplace: `codex plugin marketplace add ${marketplaceSlug}` },
  {
    id: "cursor",
    icon: "cursor",
    label: "Cursor",
    marketplace: `cursor-agent plugin marketplace add ${repositoryUrl}`,
  },
  { id: "gemini", icon: "gemini", label: "Gemini CLI", marketplace: undefined },
] as const;

export const sourceDocuments = {
  install: read("INSTALL.md"),
};
