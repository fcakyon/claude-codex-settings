# claude-codex-settings

[![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-Plugin-blue)](#available-plugins)
[![Context7 MCP](https://img.shields.io/badge/Context7%20MCP-Indexed-blue)](https://context7.com/fcakyon/claude-codex-settings)
[![llms.txt](https://img.shields.io/badge/llms.txt-✓-brightgreen)](https://context7.com/fcakyon/claude-codex-settings/llms.txt)

My personal Claude [Code](https://github.com/anthropics/claude-code)/[Desktop](https://claude.ai/download) and [OpenAI Codex](https://developers.openai.com/codex) setup with battle-tested commands and MCP servers that I use daily.

[Installation](INSTALL.md) • [Configuration](#configuration) • [MCP Servers](#mcp-servers) • [Agents](#agents) • [Hooks](#hooks) • [Commands](#commands) • [Statusline](#statusline)

## Installation

### 1. Prerequisites (Required)

Install Claude Code and dependencies:

```bash
# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install 22

# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Install required tools
brew install jq gh # macOS
# OR apt-get install jq gh  # Ubuntu

# Install code quality tools (required for hooks to work)
pip install ruff docformatter
npm install -g prettier@3.6.2 prettier-plugin-sh
```

See [INSTALL.md](INSTALL.md#prerequisites) for detailed prerequisite setup.

---

### 2. Install Configuration

**Option A: Plugin Marketplace**

Install agents, commands, hooks, and MCP servers via plugin system:

```bash
# Add marketplace
/plugin marketplace add fcakyon/claude-codex-settings

# Install plugins
/plugin install code-quality-hooks@fcakyon-claude-plugins
/plugin install git-workflow-agents@fcakyon-claude-plugins
/plugin install code-simplifier-agent@fcakyon-claude-plugins
/plugin install productivity-commands@fcakyon-claude-plugins
/plugin install mcp-server-configs@fcakyon-claude-plugins
```

Then create symlink for cross-tool compatibility:

```bash
ln -s ~/.claude/CLAUDE.md ~/.claude/AGENTS.md
```

Restart Claude Code to activate.

**Option B: Manual Clone**

<details>
<summary>Click to expand manual installation</summary>

```bash
# Clone repository
git clone https://github.com/fcakyon/claude-settings.git ~/.claude-settings

# Copy configuration files
cp -r ~/.claude-settings/.claude/* ~/.claude/

# Create symlink
ln -s ~/.claude/CLAUDE.md ~/.claude/AGENTS.md

# Make hooks executable
chmod +x ~/.claude/hooks/*.py
```

See [INSTALL.md](INSTALL.md) for complete manual setup guide.

</details>

## Available Plugins

| Plugin                    | Description                        | Installation                                                   |
| ------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| **code-quality-hooks**    | Auto-formatting for 8+ languages   | `/plugin install code-quality-hooks@fcakyon-claude-plugins`    |
| **git-workflow-agents**   | commit-manager + pr-manager agents | `/plugin install git-workflow-agents@fcakyon-claude-plugins`   |
| **code-simplifier-agent** | Pattern consistency enforcer       | `/plugin install code-simplifier-agent@fcakyon-claude-plugins` |
| **productivity-commands** | Custom slash commands              | `/plugin install productivity-commands@fcakyon-claude-plugins` |
| **mcp-server-configs**    | 9 pre-configured MCP servers       | `/plugin install mcp-server-configs@fcakyon-claude-plugins`    |

---

## Configuration

Claude Code configuration is stored in [`.claude/settings.json`](./.claude/settings.json) and includes:

- Model selection (currently using OpusPlan with claude-sonnet-4-5-20250929 - see [model configuration docs](https://docs.anthropic.com/en/docs/claude-code/model-config#opusplan-model-setting))
- Environment variables for optimal Claude Code behavior
- Settings for disabling telemetry and non-essential features
- Custom hooks for enhancing tool functionality

OpenAI Codex configuration is stored in [`~/.codex/config.toml`](./config.toml) and includes:

- Default `gpt-5-codex` model with `model_reasoning_effort` set to "high" and served through the Azure `responses` API surface
- Azure provider metadata (`model_providers.azure`) with the project-specific base URL and `env_key` secret for authentication

VSCode settings are stored in [`.vscode/settings.json`](./.vscode/settings.json) and include:

- **GitHub Copilot instructions**: Custom AI instructions for automated commit message and PR description generation
- Python formatting with Ruff, auto-save, and format-on-save enabled
- Terminal configurations for cross-platform compatibility

## MCP Servers

The MCP (Model Context Protocol) configuration lives in [`mcp.json`](./mcp.json).

### Installation

**Plugin-based:**

```bash
/plugin install mcp-server-configs@fcakyon-claude-plugins
```

<details>
<summary><b>Manual Installation</b></summary>

Copy [`mcp.json`](./mcp.json) to your project root named as `.mcp.json` and adjust MCP servers.

</details>

---

### Available MCP Servers

These are some solid MCP server repos worth checking out:

- [Azure MCP](https://github.com/Azure/azure-mcp) - 40+ Azure tools (100% free)
- [Context7](https://github.com/upstash/context7) - Up-to-date documentation context for 20K+ libraries (100% free)
- [GitHub MCP Server](https://github.com/github/github-mcp-server) - 50+ GitHub tools (100% free)
- [Linear MCP](https://linear.app/docs/mcp) - Project management tools for Linear (100% free)
- [MongoDB MCP](https://github.com/mongodb-js/mongodb-mcp-server) - Tools for interacting with MongoDB (100% free)
- [Paper Search MCP](https://github.com/openags/paper-search-mcp) - Search papers across arXiv, PubMed, bioRxiv, Google Scholar, and more (100% free)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) - 30+ browser/web testing tools (100% free)
- [Slack MCP Server](https://github.com/ubie-oss/slack-mcp-server) - 10+ Slack tools (100% free)
- [Supabase MCP](https://github.com/supabase-community/supabase-mcp) - Database tools for interacting with Supabase (100% free) - [Configuration guide](https://supabase.com/docs/guides/getting-started/mcp#step-2-configure-your-ai-tool)
- [Tavily MCP](https://github.com/tavily-ai/tavily-mcp) - 4 tools for web search and scraping. Better than Claude Code's built-in WebFetch tool (free tier: 1000 monthly requests)

OpenAI Codex compatible version of MCP server configurations can be found in [`~/.codex/config.toml`](./config.toml).

## Agents

Specialized agents that run automatically to enhance code quality, stored in [`.claude/agents/`](./.claude/agents/):

### Installation

**Plugin-based:**

```bash
/plugin install git-workflow-agents@fcakyon-claude-plugins
/plugin install code-simplifier-agent@fcakyon-claude-plugins
```

<details>
<summary><b>Manual Installation</b></summary>

Copy agents from [`.claude/agents/`](./.claude/agents/) to your project's `.claude/agents/` directory.

</details>

---

- [`code-simplifier.md`](./.claude/agents/code-simplifier.md) - Contextual pattern analyzer that ensures new code follows existing project conventions (imports, naming, function signatures, class patterns). Auto-triggers after TodoWrite to maintain codebase consistency.

- [`commit-manager.md`](./.claude/agents/commit-manager.md) - Git commit expert that analyzes staged changes, creates optimal commit strategies, and executes commits with meaningful messages. Handles documentation updates and multi-commit scenarios.

- [`pr-manager.md`](./.claude/agents/pr-manager.md) - Git and GitHub PR workflow automation that handles branch creation, commits via commit-manager agent, documentation updates, and PR submission with proper formatting.

For more details, see the [Claude Code sub-agents documentation](https://docs.anthropic.com/en/docs/claude-code/sub-agents).

## Hooks

Custom hooks that enhance tool usage, configured in [`.claude/settings.json`](./.claude/settings.json):

### Installation

**Plugin-based:**

```bash
/plugin install code-quality-hooks@fcakyon-claude-plugins
```

<details>
<summary><b>Manual Installation</b></summary>

1. Copy hooks from [`.claude/hooks/`](./.claude/hooks/) to your project
2. Copy hook configuration from [`.claude/settings.json`](./.claude/settings.json)
3. Make scripts executable:
   ```bash
   chmod +x ./.claude/hooks/*.py
   ```

</details>

---

### Setup

Make hook scripts executable after cloning:

```bash
chmod +x ./.claude/hooks/*.py
```

### Context Management Hooks

These hooks ensure Claude always has access to project-specific instructions by automatically loading them on each prompt.

- **[hook_load_claude_md.py](./.claude/hooks/hook_load_claude_md.py)**: Auto-loads CLAUDE.md or AGENTS.md from the project directory on every user prompt. Prevents AI from forgetting main instructions by re-injecting them at every prompt submission.

### Web Content Enhancement Hooks

These hooks redirect native Claude Code web tools to faster and more reliable Tavily alternatives. Native WebSearch/WebFetch tools take 20-30 seconds while Tavily equivalents complete in 1-2 seconds. Additionally, native WebFetch often fails on bot-protected websites while Tavily can bypass these protections.

- **[hook_webfetch_to_tavily_extract.py](./.claude/hooks/hook_webfetch_to_tavily_extract.py)**: Blocks WebFetch and suggests using Tavily extract with advanced depth
- **[hook_tavily_extract_to_advanced.py](./.claude/hooks/hook_tavily_extract_to_advanced.py)**: Enhances tavily-extract calls with advanced extraction depth for better content parsing
- **[hook_websearch_to_tavily_search.py](./.claude/hooks/hook_websearch_to_tavily_search.py)**: Blocks WebSearch and suggests using Tavily search instead

### Code Quality Hooks

Comprehensive auto-formatting system that covers all major file types, designed to eliminate formatting inconsistencies and reduce CI formatting noise.

- **Whitespace Cleanup** ([settings.json#L64-L74](./.claude/settings.json#L64-L74)): Automatically removes whitespace from empty lines in Python, JavaScript, and TypeScript files (`.py`, `.js`, `.jsx`, `.ts`, `.tsx`) after any Edit, MultiEdit, Write, or Task operation. Works cross-platform (macOS and Linux).

- **Python Code Quality** ([hook_python_code_quality.py](./.claude/hooks/hook_python_code_quality.py)): Automatically formats and lints Python files using ruff and docformatter after Edit/Write/MultiEdit operations. Matches [Ultralytics Actions](https://github.com/ultralytics/actions) pipeline exactly:
  - `ruff format --line-length 120`
  - `ruff check --fix --unsafe-fixes --extend-select I,D,UP --target-version py38`
  - `docformatter --wrap-summaries 120 --wrap-descriptions 120`
- **Prettier Formatting** ([hook_prettier_formatting.py](./.claude/hooks/hook_prettier_formatting.py)): Auto-formats JavaScript, TypeScript, CSS, JSON, YAML, HTML, Vue, and Svelte files using prettier. Skips lock files and model.json to prevent conflicts.

- **Markdown Formatting** ([hook_markdown_formatting.py](./.claude/hooks/hook_markdown_formatting.py)): Formats Markdown files with prettier, applying special tab-width 4 handling for documentation directories (matches [Ultralytics Actions](https://github.com/ultralytics/actions) docs formatting).

- **Bash/Shell Formatting** ([hook_bash_formatting.py](./.claude/hooks/hook_bash_formatting.py)): Formats shell scripts (`.sh`, `.bash`) using prettier-plugin-sh for consistent bash scripting style.

- **Ripgrep Enforcement** ([hook_enforce_rg_over_grep.py](./.claude/hooks/hook_enforce_rg_over_grep.py)): Blocks grep and find commands in Bash tool calls, suggesting rg (ripgrep) alternatives for better performance and more features.

#### Zero CI Formatting

This comprehensive formatting setup is designed to achieve **zero auto-formatting** from CI workflows like [Ultralytics Actions](https://github.com/ultralytics/actions). The hooks cover 95% of typical formatting needs:

- ✅ Python (ruff + docformatter)
- ✅ JavaScript/TypeScript (prettier)
- ✅ CSS/SCSS/Less (prettier)
- ✅ JSON/YAML (prettier)
- ✅ HTML/Vue/Svelte (prettier)
- ✅ Markdown (prettier with docs handling)
- ✅ Shell scripts (prettier-plugin-sh)
- ✅ Whitespace cleanup

All hooks gracefully degrade when tools aren't available, never disrupting Claude Code operations. Python formatting configuration inspired by [onuralpszr's setup](https://github.com/onuralpszr/onuralpszr/blob/main/configs/git-hooks/pre-commit-line-120).

For more details, see the [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks).

## Commands

Custom Claude Code slash commands that make life easier, stored in [`.claude/commands/`](./.claude/commands/):

### Installation

**Plugin-based:**

```bash
/plugin install productivity-commands@fcakyon-claude-plugins
```

<details>
<summary><b>Manual Installation</b></summary>

Copy commands from [`.claude/commands/`](./.claude/commands/) to your project's `.claude/commands/` directory.

</details>

---

- [`/commit-staged`](./.claude/commands/commit-staged.md) - Commit staged changes using the commit-manager agent with optional context
- [`/create-pr`](./.claude/commands/create-pr.md) - Create pull request using the pr-manager agent with optional context
- [`/explain-architecture-pattern`](./.claude/commands/explain-architecture-pattern.md) - Identify and explain architectural patterns and design decisions
- [`/update-pr-summary`](./.claude/commands/update-pr-summary.md) - Generate PR summaries with advanced analytical frameworks

## Statusline

The setup includes a custom statusline powered by [ccusage](https://ccusage.com/) that displays Claude usage statistics in real-time. The statusline configuration provides:

- **Real-time usage tracking**: Monitor token consumption and API costs as you work
- **Offline support**: Cached data ensures statusline works without internet connectivity
- **Customizable refresh**: Updates every 2 seconds for responsive feedback
- **Turkish localization**: Displays costs and dates in Turkish format (configurable)

### Configuration

The statusline is configured through two files:

- **[`.claude/settings.json`](./.claude/settings.json)**: Contains the statusline command configuration
- **[`.claude/ccusage.json`](./.claude/ccusage.json)**: ccusage-specific settings for locale, timezone, and refresh behavior

For detailed setup instructions and customization options, see the [ccusage statusline guide](https://ccusage.com/guide/statusline).

## Extra Resources

- [Claude MCP Server Setup](https://docs.anthropic.com/en/docs/claude-code/mcp#project-scope)

- [Claude Code Commands Setup](https://docs.anthropic.com/en/docs/claude-code/slash-commands#command-types)

## Thank you for the support!

[![Star History Chart](https://api.star-history.com/svg?repos=fcakyon/claude-settings&type=Date)](https://www.star-history.com/#fcakyon/claude-settings&Date)
