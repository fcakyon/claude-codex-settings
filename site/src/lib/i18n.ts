export type Locale = "en" | "zh-CN";

export const localePath = (locale: Locale) => (locale === "en" ? "/" : "/zh-cn/");

export const translations = {
  en: {
    htmlLang: "en",
    ogLocale: "en_US",
    languageLabel: "简体中文",
    footer: {
      credit: "Developed using web development plugins from",
      sitemap: "Sitemap",
    },
    settings: {
      meta: {
        title: "Claude Settings for Claude Code, Codex and Cursor",
        description:
          "Battle-tested settings, skills, hooks and agents for Claude Code, OpenAI Codex, Cursor and Gemini by Fatih C. Akyon.",
      },
      nav: [
        ["Install", "#install"],
        ["Providers", "#providers"],
        ["Plugins", "#plugins"],
        ["Configuration", "#configuration"],
      ],
      hero: {
        title: "Battle-tested settings for Claude Code, Codex and Cursor",
        description:
          "One practical setup for skills, commands, hooks, agents and MCP servers across your AI coding tools.",
        repository: "View the repository",
        install: "Read the install guide",
        stars: "stars",
      },
      configuration: {
        title: "One setup, four coding tools",
        description: "A single, practical configuration that works across the tools you already use.",
        tools: [
          "Settings, hooks, commands and agents",
          "Plugins, skills and shared guidance",
          "Portable plugins and project rules",
          "Extensions, skills and shared guidance",
        ],
      },
      providers: {
        title: "Use Claude Code with three model providers",
        description: "Provider routes and model names are read from the repository settings on every build.",
        columns: ["Provider", "Claude Code", "Codex CLI", "Models", "Source"],
        claudeDirect: "Direct Anthropic-compatible API",
        codexProxy: "Local Responses proxy",
        codexUnavailable: "No official Codex route",
        claudeSource: "Claude settings",
        codexSource: "Codex recipe",
      },
      install: {
        title: "Start with one command",
        description: "Add the marketplace once, then install only the plugins you need.",
      },
      plugins: {
        title: "Plugins with a clear job",
        description: "Descriptions and links come from the repository manifests on every build.",
        browse: "Browse every plugin",
      },
    },
    plugins: {
      meta: {
        title: "Agent Plugins for Claude Code, Codex, Cursor and Gemini",
        description:
          "Browse installable skills, hooks and agents for Claude Code, OpenAI Codex, Cursor and Gemini by Fatih C. Akyon.",
      },
      nav: [
        ["Browse", "#browse"],
        ["Install", "#install"],
        ["Compatibility", "#compatibility"],
      ],
      hero: {
        title: "Agent plugins that do real work",
        description: "Browse installable skills, hooks and agents for Claude Code, Codex, Cursor and Gemini.",
      },
      compatibility: {
        title: "Use the same skills across tools",
        description: "Support labels are derived from the manifest files present in each plugin directory.",
        tools: [
          "Plugins, skills, agents, hooks and commands",
          "Plugins, skills and shared agent guidance",
          "Plugins, skills and project guidance",
          "Extensions, skills, agents and hooks",
        ],
      },
      directory: {
        search: "Search plugins and skills",
        available: "Available plugins",
        columns: ["#", "Plugin", "Description", "Supported tools", "Link"],
        view: "View plugin",
        empty: "No plugins match that search.",
        installVia: "Install via",
        chooseTool: "Choose a tool",
        addMarketplace: "Add marketplace (one time)",
        installPlugin: "Install plugin",
        copyMarketplace: "Copy marketplace command",
        copyInstall: "Copy install command",
        note: "Pick a tab to switch tools, or a plugin name to change the command.",
        unavailable: "is not available for",
        shown: "plugins shown",
      },
    },
    editor: {
      files: "Repository files",
      project: "Project",
      tabs: "Configuration files",
      terminal: "Terminal",
      copy: "Copy clone URL",
    },
    github: "View on GitHub",
  },
  "zh-CN": {
    htmlLang: "zh-CN",
    ogLocale: "zh_CN",
    languageLabel: "English",
    footer: {
      credit: "使用以下仓库中的网页开发插件构建：",
      sitemap: "网站地图",
    },
    settings: {
      meta: {
        title: "Claude Code 配置与 Codex CLI 插件 | Claude Settings",
        description: "适用于 Claude Code、Codex CLI、Cursor 和 Gemini CLI 的配置、技能、钩子与智能体安装指南。",
      },
      nav: [
        ["安装", "#install"],
        ["模型服务", "#providers"],
        ["插件", "#plugins"],
        ["配置", "#configuration"],
      ],
      hero: {
        title: "适用于 Claude Code、Codex 和 Cursor 的实用配置",
        description: "在常用的 AI 编程工具之间共享技能、命令、钩子、智能体和 MCP 服务。",
        repository: "查看 GitHub 仓库",
        install: "阅读安装指南",
        stars: "个星标",
      },
      configuration: {
        title: "一套配置，支持四种编程工具",
        description: "直接使用仓库中的配置，在常用的 AI 编程工具之间保持一致。",
        tools: ["设置、钩子、命令和智能体", "插件、技能和共享指引", "可移植插件和项目规则", "扩展、技能和共享指引"],
      },
      providers: {
        title: "在 Claude Code 中使用三种模型服务",
        description: "每次构建都会从仓库配置读取 Kimi、MiniMax 和智谱 GLM 的接入方式与模型名称。",
        columns: ["模型服务", "Claude Code", "Codex CLI", "模型", "配置来源"],
        claudeDirect: "直接使用 Anthropic 兼容接口",
        codexProxy: "通过本地 Responses 代理",
        codexUnavailable: "暂无官方 Codex 接入方式",
        claudeSource: "Claude 配置",
        codexSource: "Codex 配方",
      },
      install: {
        title: "从一条命令开始",
        description: "添加一次插件市场，然后只安装需要的插件。",
      },
      plugins: {
        title: "每个插件都有明确用途",
        description: "插件说明和链接会在每次构建时从仓库清单读取。",
        browse: "浏览全部插件",
      },
    },
    plugins: {
      meta: {
        title: "Claude Code 与 Codex CLI 插件目录 | Agent Plugins",
        description: "浏览适用于 Claude Code、Codex CLI、Cursor 和 Gemini CLI 的技能、钩子与智能体，并复制安装命令。",
      },
      nav: [
        ["浏览", "#browse"],
        ["安装", "#install"],
        ["兼容性", "#compatibility"],
      ],
      hero: {
        title: "真正解决问题的 AI 编程工具插件",
        description: "浏览可安装到 Claude Code、Codex、Cursor 和 Gemini 的技能、钩子与智能体。",
      },
      compatibility: {
        title: "在不同工具中使用同一套技能",
        description: "支持范围会根据每个插件目录中的清单文件自动生成。",
        tools: [
          "插件、技能、智能体、钩子和命令",
          "插件、技能和共享智能体指引",
          "插件、技能和项目指引",
          "扩展、技能、智能体和钩子",
        ],
      },
      directory: {
        search: "搜索插件和技能",
        available: "可用插件",
        columns: ["#", "插件", "说明", "支持的工具", "链接"],
        view: "查看插件",
        empty: "没有插件符合当前搜索。",
        installVia: "安装工具：",
        chooseTool: "选择工具",
        addMarketplace: "添加插件市场（仅需一次）",
        installPlugin: "安装插件",
        copyMarketplace: "复制插件市场命令",
        copyInstall: "复制安装命令",
        note: "切换工具标签，或选择插件名称来更新安装命令。",
        unavailable: "暂不支持",
        shown: "个插件",
      },
    },
    editor: {
      files: "仓库文件",
      project: "项目",
      tabs: "配置文件",
      terminal: "终端",
      copy: "复制克隆地址",
    },
    github: "在 GitHub 查看",
  },
} as const;
