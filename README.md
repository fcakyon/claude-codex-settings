<div align="center">
  <img src="https://github.com/user-attachments/assets/a978cb0a-785d-4a7d-aff2-7e962edd3120" width="10000" alt="Claude Codex Settings Logo">

[![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-Plugin-blue)](#available-plugins)
[![Context7 MCP](https://img.shields.io/badge/Context7%20MCP-Indexed-blue)](https://context7.com/fcakyon/claude-codex-settings)
[![llms.txt](https://img.shields.io/badge/llms.txt-✓-brightgreen)](https://context7.com/fcakyon/claude-codex-settings/llms.txt)

My daily battle-tested Claude [Code](https://github.com/anthropics/claude-code)/[Desktop](https://claude.ai/download) and [OpenAI Codex](https://developers.openai.com/codex) setup with commands, hooks, subagents and MCP servers.

[Installation](#installation) • [Plugins](#plugins) • [Configuration](#configuration) • [Statusline](#statusline) • [References](#references)

</div>

## Installation

> **Prerequisites:** Before installing, ensure you have Claude Code and required tools installed. See [INSTALL.md](INSTALL.md) for complete prerequisites.

Install agents, commands, hooks, skills, and MCP servers via [Claude Code Plugins](https://docs.claude.com/en/docs/claude-code/plugins) system:

```bash
# Add marketplace
/plugin marketplace add fcakyon/claude-codex-settings

# Install plugins
/plugin install ultralytics-dev@fcakyon-claude-plugins # Formatting hooks + Slack/MongoDB MCPs
/plugin install github-dev@fcakyon-claude-plugins      # Git workflow agents + commands
/plugin install websearch-tools@fcakyon-claude-plugins # Tavily hooks + web search MCP
/plugin install general-dev@fcakyon-claude-plugins     # Code simplifier + utilities
/plugin install plugin-dev@fcakyon-claude-plugins      # Plugin development toolkit
```

Then create symlink for cross-tool compatibility:

```bash
ln -s CLAUDE.md AGENTS.md
```

Restart Claude Code to activate.

## Plugins

<details>
<summary><strong>ultralytics-dev</strong> - Auto-formatting + Slack/MongoDB/Linear MCPs</summary>

Auto-formatting hooks for Python, JavaScript, Markdown, and Bash. Includes MCP servers for Slack, MongoDB, and Linear with usage skills.

**Hooks:**

- [`format_python_docstrings.py`](./.claude/hooks/format_python_docstrings.py) - Google-style docstring formatter
- [`python_code_quality.py`](./.claude/hooks/python_code_quality.py) - Python code quality with ruff
- [`prettier_formatting.py`](./.claude/hooks/prettier_formatting.py) - JavaScript/TypeScript/CSS/JSON
- [`markdown_formatting.py`](./.claude/hooks/markdown_formatting.py) - Markdown formatting
- [`bash_formatting.py`](./.claude/hooks/bash_formatting.py) - Bash script formatting

**MCPs:** Slack, MongoDB, Linear

**Skills:**

- **slack-usage** - Search Slack messages and view channel history
- **mongodb-usage** - Query MongoDB collections and schemas
</details>

<details>
<summary><strong>github-dev</strong> - Git workflow agents + commands</summary>

Git and GitHub automation with commit-manager and pr-manager agents plus workflow skills.

**Agents:**

- [`code-simplifier`](./plugins/general-dev/agents/code-simplifier.md) - Ensures code follows project conventions
- [`commit-manager`](./plugins/github-dev/agents/commit-manager.md) - Git commit expert
- [`pr-manager`](./plugins/github-dev/agents/pr-manager.md) - GitHub PR workflow automation

**Commands:**

- [`/clean-gone-branches`](./plugins/github-dev/commands/clean-gone-branches.md) - Clean up deleted remote branches
- [`/commit-staged`](./plugins/github-dev/commands/commit-staged.md) - Commit changes with context
- [`/create-pr`](./plugins/github-dev/commands/create-pr.md) - Create pull request with context

**Skills:**

- **pr-workflow** - Complete PR creation workflow
- **commit-workflow** - Commit best practices and automation

</details>

<details>
<summary><strong>websearch-tools</strong> - Tavily web search + hooks</summary>

Tavily MCP server for web search and content extraction with Tavily hooks and usage skill.

**Hooks:**

- [`webfetch_to_tavily_extract.py`](./.claude/hooks/webfetch_to_tavily_extract.py) - Redirect WebFetch
- [`websearch_to_tavily_search.py`](./.claude/hooks/websearch_to_tavily_search.py) - Redirect WebSearch
- [`tavily_extract_to_advanced.py`](./.claude/hooks/tavily_extract_to_advanced.py) - Auto-enable advanced extraction

**MCPs:** Tavily, Context7

**Skills:**

- **tavily-usage** - Web search and content extraction workflows
</details>

<details>
<summary><strong>general-dev</strong> - Code simplifier + utilities</summary>

Code quality agent, architecture pattern command, and general utility hooks.

**Agent:**

- [`code-simplifier`](./plugins/general-dev/agents/code-simplifier.md) - Ensures code follows conventions

**Command:**

- [`/explain-architecture-pattern`](./plugins/general-dev/commands/explain-architecture-pattern.md) - Identify design patterns

**Hooks:**

- [`load_claude_md.py`](./.claude/hooks/load_claude_md.py) - Auto-load CLAUDE.md
- [`enforce_rg_over_grep.py`](./.claude/hooks/enforce_rg_over_grep.py) - Suggest ripgrep

</details>

<details>
<summary><strong>plugin-dev</strong> - Plugin development toolkit</summary>

Complete toolkit for building Claude Code plugins with skills, agents, and validation.

**Skills:**

- [`hook-development`](./plugins/plugin-dev/skills/hook-development/SKILL.md) - Create hooks with prompt-based API
- [`mcp-integration`](./plugins/plugin-dev/skills/mcp-integration/SKILL.md) - Configure MCP servers
- [`plugin-structure`](./plugins/plugin-dev/skills/plugin-structure/SKILL.md) - Plugin layout and auto-discovery
- [`plugin-settings`](./plugins/plugin-dev/skills/plugin-settings/SKILL.md) - Per-project configuration
- [`command-development`](./plugins/plugin-dev/skills/command-development/SKILL.md) - Create custom commands
- [`agent-development`](./plugins/plugin-dev/skills/agent-development/SKILL.md) - Build autonomous agents
- [`skill-development`](./plugins/plugin-dev/skills/skill-development/SKILL.md) - Create reusable skills with progressive disclosure

**Agents:**

- [`agent-creator`](./plugins/plugin-dev/agents/agent-creator.md) - AI-assisted agent generation
- [`plugin-validator`](./plugins/plugin-dev/agents/plugin-validator.md) - Validate plugin structure
- [`skill-reviewer`](./plugins/plugin-dev/agents/skill-reviewer.md) - Improve skill quality

**Command:**

- [`/plugin-dev:create-plugin`](./plugins/plugin-dev/commands/create-plugin.md) - 8-phase guided plugin workflow

</details>

---

## Configuration

<details>
<summary><strong>Claude Code</strong></summary>

Configuration in [`.claude/settings.json`](./.claude/settings.json):

- **Model**: SonnetPlan mode (plan: Claude Sonnet 4.5, execute: Haiku 4.5) - [source](https://github.com/anthropics/claude-code/blob/4dc23d0275ff615ba1dccbdd76ad2b12a3ede591/CHANGELOG.md?plain=1#L61)
- **Environment**: bash working directory, telemetry disabled, MCP output limits
- **Permissions**: bash commands, git operations, MCP tools
- **Statusline**: Custom usage tracking powered by [ccusage](https://ccusage.com/)
- **Plugins**: All plugins enabled

</details>

<details>
<summary><strong>Z.ai (85% cheaper)</strong></summary>

Configuration in [`.claude/settings-zai.json`](./.claude/settings-zai.json) using [Z.ai GLM models via Anthropic-compatible API](https://docs.z.ai/scenario-example/develop-tools/claude):

- **Main model**: GLM-4.6 (dialogue, planning, coding, complex reasoning)
- **Fast model**: GLM-4.5-Air (file search, syntax checking)
- **Cost savings**: 85% cheaper than Claude 4.5 - [source](https://z.ai/blog/glm-4.6)
- **API key**: Get from [z.ai/model-api](https://z.ai/model-api)

</details>

<details>
<summary><strong>OpenAI Codex</strong></summary>

Configuration in [`~/.codex/config.toml`](./config.toml):

- **Model**: `gpt-5-codex` with `model_reasoning_effort` set to "high"
- **Provider**: Azure via `responses` API surface
- **Auth**: Project-specific base URL with `env_key` authentication

</details>

<details>
<summary><strong>VSCode</strong></summary>

Settings in [`.vscode/settings.json`](./.vscode/settings.json):

- **GitHub Copilot**: Custom instructions for automated commit messages and PR descriptions
- **Python**: Ruff formatting with auto-save and format-on-save enabled
- **Terminal**: Cross-platform compatibility configurations

</details>

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

## References

- [Claude Code](https://github.com/anthropics/claude-code) - Official CLI for Claude
- [Anthropic Skills](https://github.com/anthropics/skills) - Official skill examples

## Thank you for the support!

[![Star History Chart](https://api.star-history.com/svg?repos=fcakyon/claude-settings&type=Date)](https://www.star-history.com/#fcakyon/claude-settings&Date)
