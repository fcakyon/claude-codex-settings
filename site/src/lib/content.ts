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

const skillDescriptions = (content: string) => {
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)?.[1] || "";
  const match = frontmatter.match(/^description:\s*(.*)$/m);
  if (!match) return "Read the skill instructions and supported workflow.";
  if (!/^[>|][+-]?$/.test(match[1])) return match[1].replace(/^['"]|['"]$/g, "").replace(/"([^"]+)"/g, "“$1”");
  const lines = frontmatter.slice((match.index || 0) + match[0].length).split("\n");
  const end = lines.findIndex((line) => line && !/^\s+/.test(line));
  return lines
    .slice(0, end < 0 ? lines.length : end)
    .map((line) => line.trim())
    .join(" ")
    .replace(/"([^"]+)"/g, "“$1”");
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
      index,
      tools,
      components,
      href: localSource ? `${repositoryUrl}/tree/main/${localSource.replace(/^\.\//, "")}` : externalUrl,
      claudeCommand,
      codexCommand,
      cursorCommand,
      geminiCommand,
      installCommands: [
        {
          id: "claude",
          tool: "Claude Code",
          command: claudeCommand,
          output: [`Resolving ${plugin.name}@claude-settings…`, `✓ Installed ${plugin.name}`],
        },
        ...(codexCommand
          ? [
              {
                id: "codex",
                tool: "OpenAI Codex",
                command: codexCommand,
                output: [`Resolving ${plugin.name}@claude-settings…`, `✓ Added ${plugin.name}`],
              },
            ]
          : []),
        ...(cursorCommand
          ? [
              {
                id: "cursor",
                tool: "Cursor",
                command: cursorCommand,
                output: [`Opening ${plugin.name} in Cursor Agent…`, `Type /plugin and choose ${plugin.name}`],
              },
            ]
          : []),
        ...(geminiCommand
          ? [
              {
                id: "gemini",
                tool: "Gemini CLI",
                command: geminiCommand,
                output: [`Reading ./plugins/${plugin.name}/gemini-extension.json…`, `✓ Installed ${plugin.name}`],
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

export const pluginByName = new Map(plugins.map((plugin) => [plugin.name, plugin]));

const duplicateSkillNames = new Set(
  plugins
    .flatMap((plugin) => plugin.components?.skills || [])
    .filter((name, _, names) => names.indexOf(name) !== names.lastIndexOf(name)),
);
const skillSeo: Record<string, { title: string; description: string; intro: string }> = {
  "frontend-design-skills/openai-frontend-design": {
    title: "Download the OpenAI frontend design skill",
    description:
      "Download the OpenAI frontend design skill as a ZIP for ChatGPT or Claude.ai, then follow its visual design and browser verification workflow.",
    intro:
      "Use this skill when you want an agent to design a complete interface, implement it in your existing stack, and compare the result in a browser.",
  },
  "frontend-design-skills/anthropic-frontend-design": {
    title: "Download the Anthropic frontend design skill",
    description:
      "Download the Anthropic frontend design skill as a ZIP for ChatGPT or Claude.ai and apply its interface design guidance to web projects.",
    intro:
      "Use this skill to give an agent a focused design process for layout, typography, visual direction, and implementation.",
  },
  "frontend-design-skills/writing-guidelines": {
    title: "Apply writing guidelines with an agent skill",
    description:
      "Download a writing guidelines skill for ChatGPT or Claude.ai to review documentation, interface copy, structure, tone, and formatting.",
    intro:
      "Use this skill to check documentation and product copy against a concrete editorial standard, then report issues by file and line.",
  },
  "github-dev/create-pr": {
    title: "Create GitHub pull requests with an agent skill",
    description:
      "Download the create PR skill for ChatGPT or Claude.ai and guide an agent through branch checks, GitHub CLI commands, and pull request creation.",
    intro:
      "Use this skill when you want an agent to inspect a branch, prepare a concise pull request, and open it with the GitHub CLI.",
  },
  "github-dev/review-pr": {
    title: "Review GitHub pull requests with an agent skill",
    description:
      "Download the review PR skill for ChatGPT or Claude.ai to inspect a pull request, trace risks, and produce actionable code review findings.",
    intro:
      "Use this skill when you need a structured review that checks the full pull request diff and reports only actionable findings.",
  },
  "github-dev/resolve-pr-comments": {
    title: "Resolve pull request comments with an agent skill",
    description:
      "Download the resolve PR comments skill for ChatGPT or Claude.ai to inspect review feedback, apply fixes, and verify each response.",
    intro:
      "Use this skill when review comments need code changes, concise replies, and a final check that every thread has been addressed.",
  },
};

export const skills = plugins
  .flatMap((plugin) =>
    (plugin.components?.skills || []).map((name) => {
      const key = `${plugin.name}/${name}`;
      const directory = resolve(root, "plugins", plugin.name, "skills", name);
      const content = read(`plugins/${plugin.name}/skills/${name}/SKILL.md`);
      const assetPlugin = plugin.name.endsWith("-office-skills")
        ? plugin.name.replace(/-office-skills$/, "")
        : plugin.name;
      const asset = `${duplicateSkillNames.has(name) ? `${assetPlugin}-${name}` : name}.zip`;
      const bundled = ["scripts", "references", "assets", "templates"].filter((folder) =>
        existsSync(resolve(directory, folder)),
      );
      return {
        key,
        name,
        plugin: plugin.name,
        pluginDescription: plugin.description,
        description: skillDescriptions(content),
        asset,
        downloadUrl: `${repositoryUrl}/releases/latest/download/${asset}`,
        sourceUrl: `${repositoryUrl}/tree/main/plugins/${plugin.name}/skills/${name}`,
        bundled,
        externalSetup:
          /\b(?:API key|authentication|CLI|MCP server|Node\.js|Python|GitHub CLI|Azure CLI|gcloud|Tavily|Overleaf)\b/i.test(
            content,
          ),
        seo: skillSeo[key],
      };
    }),
  )
  .sort((a, b) => a.name.localeCompare(b.name) || a.plugin.localeCompare(b.plugin));

export type Skill = (typeof skills)[number];
export const seoSkills = skills.filter((skill) => skill.seo);

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
  ...seoSkills.map((skill) => ({
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
  claude: read(".claude/CLAUDE.md"),
  install: read("INSTALL.md"),
};
