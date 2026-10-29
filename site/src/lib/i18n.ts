export const locales = {
  en: { path: "/", og: "en_US", alternate: "zh-CN" },
  "zh-CN": { path: "/zh-cn/", og: "zh_CN", alternate: "en" },
} as const;

export type Locale = keyof typeof locales;

export const translations = {
  en: {
    languageLabel: "简体中文",
    stars: "stars",
    downloads: "downloads",
    downloadSource: (releases: string, date: string) => `ZIP downloads across ${releases} GitHub releases. Updated ${date}.`,
    skipToContent: "Skip to main content",
    copied: "Copied to clipboard",
    primaryNav: "Primary navigation",
    footer: {
      madeBy: ["Made by ", ""],
      sitemap: "Sitemap",
    },
    settings: {
      meta: {
        title: "Claude Settings for Claude Code, Codex and Cursor",
        description: (providers: string) =>
          `Copy working Claude Code and Codex CLI settings with ${providers} variants, and install plugins, skills and hooks from one marketplace.`,
      },
      nav: [
        ["Settings", "/settings/"],
        ["Plugins", "/plugins/"],
        ["Skills", "/skills/"],
        ["Install", "/guides/install-agent-skills/"],
      ],
      hero: {
        title: "Claude Code and Codex settings",
        description: (providers: string) =>
          `Copy the settings files, including variants for ${providers}. Then install plugins that add skills, hooks and agents.`,
        browse: (count: number) => `Browse ${count} plugins`,
        install: "Install guide",
      },
      configuration: {
        title: "Add the marketplace",
        description: "Run one command in your tool, then install plugins by name.",
        copyCommand: "Copy the command for",
        tools: [
          "Then run <code>claude plugin install plugin_name@claude-settings</code>.",
          "Then run <code>codex plugin add plugin_name@claude-settings</code> and start a new session.",
          "Then run <code>cursor-agent</code> and enter <code>/plugin</code> to pick a plugin.",
          "Run it inside a clone of this repository.",
        ],
      },
      plugins: {
        title: "Featured plugins",
        browse: (count: number) => `All ${count} plugins`,
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
        title: "Plugins for Claude Code, Codex, Cursor and Gemini",
        description: "Search by task, pick a plugin and copy its install command.",
      },
      compatibility: {
        title: "Supported tools",
        tools: [
          "Plugins, skills, agents, hooks and commands",
          "Plugins, skills and shared agent guidance",
          "Plugins, skills and project guidance",
          "Extensions, skills, agents and hooks",
        ],
      },
      directory: {
        search: "Search plugins and skills…",
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
        note: "Select a plugin name to change the command.",
        unavailable: "is not available for",
        shown: "plugins shown",
      },
    },
    editor: {
      files: "Repository files",
      tabs: "Configuration files",
      copy: "Copy clone URL",
    },
    github: "View on GitHub",
  },
  "zh-CN": {
    languageLabel: "English",
    stars: "个星标",
    downloads: "次下载",
    downloadSource: (releases: string, date: string) => `${releases} 个 GitHub 版本的 ZIP 下载总次数。更新于 ${date}。`,
    skipToContent: "跳到主要内容",
    copied: "已复制到剪贴板",
    primaryNav: "主导航",
    footer: {
      madeBy: ["由 ", " 制作"],
      sitemap: "网站地图",
    },
    settings: {
      meta: {
        title: "Claude Code 配置与 Codex CLI 插件 | Claude Settings",
        description: (providers: string) =>
          `复制可直接使用的 Claude Code 与 Codex CLI 配置（含 ${providers} 版本），并从同一个插件市场安装插件、技能和钩子。`,
      },
      nav: [
        ["安装", "#install"],
        ["插件", "#plugins"],
      ],
      hero: {
        title: "Claude Code 与 Codex 配置",
        description: (providers: string) => `复制配置文件，包括 ${providers} 版本。然后安装插件，添加技能、钩子和智能体。`,
        browse: (count: number) => `浏览 ${count} 个插件`,
        install: "安装指南",
      },
      configuration: {
        title: "添加插件市场",
        description: "在你的工具中运行一条命令，然后按名称安装插件。",
        copyCommand: "复制以下工具的命令：",
        tools: [
          "然后运行 <code>claude plugin install plugin_name@claude-settings</code>。",
          "然后运行 <code>codex plugin add plugin_name@claude-settings</code>，并开启新会话。",
          "然后运行 <code>cursor-agent</code>，输入 <code>/plugin</code> 选择插件。",
          "请在本仓库的克隆目录中运行。",
        ],
      },
      plugins: {
        title: "精选插件",
        browse: (count: number) => `全部 ${count} 个插件`,
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
        title: "适用于 Claude Code、Codex、Cursor 和 Gemini 的插件",
        description: "按任务搜索，选择插件，复制安装命令。",
      },
      compatibility: {
        title: "支持的工具",
        tools: [
          "插件、技能、智能体、钩子和命令",
          "插件、技能和共享智能体指引",
          "插件、技能和项目指引",
          "扩展、技能、智能体和钩子",
        ],
      },
      directory: {
        search: "搜索插件和技能…",
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
        note: "选择插件名称即可更新安装命令。",
        unavailable: "暂不支持",
        shown: "个插件",
      },
    },
    editor: {
      files: "仓库文件",
      tabs: "配置文件",
      copy: "复制克隆地址",
    },
    github: "在 GitHub 查看",
  },
} as const;
