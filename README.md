<div align="center">
  <img src="https://github.com/user-attachments/assets/a978cb0a-785d-4a7d-aff2-7e962edd3120" width="10000" alt="Claude Codex Settings Logo">

[![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-Plugin-blue)](#available-plugins)
[![Context7 MCP](https://img.shields.io/badge/Context7%20MCP-Indexed-blue)](https://context7.com/fcakyon/claude-codex-settings)
[![llms.txt](https://img.shields.io/badge/llms.txt-✓-brightgreen)](https://context7.com/fcakyon/claude-codex-settings/llms.txt)

My daily battle-tested Claude [Code](https://github.com/anthropics/claude-code)/[Desktop](https://claude.ai/download) and [OpenAI Codex](https://developers.openai.com/codex) setup with skills, commands, hooks, subagents and MCP servers.

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
/plugin install claude-tools@fcakyon-claude-plugins    # Sync CLAUDE.md + allowlist
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

- [`format_python_docstrings.py`](./plugins/ultralytics-dev/hooks/scripts/format_python_docstrings.py) - Google-style docstring formatter
- [`python_code_quality.py`](./plugins/ultralytics-dev/hooks/scripts/python_code_quality.py) - Python code quality with ruff
- [`prettier_formatting.py`](./plugins/ultralytics-dev/hooks/scripts/prettier_formatting.py) - JavaScript/TypeScript/CSS/JSON
- [`markdown_formatting.py`](./plugins/ultralytics-dev/hooks/scripts/markdown_formatting.py) - Markdown formatting
- [`bash_formatting.py`](./plugins/ultralytics-dev/hooks/scripts/bash_formatting.py) - Bash script formatting

**MCPs:** Slack, MongoDB, Linear

**Skills:**

- [`slack-usage`](./plugins/ultralytics-dev/skills/slack-usage/SKILL.md) - Search Slack messages and view channel history
- [`mongodb-usage`](./plugins/ultralytics-dev/skills/mongodb-usage/SKILL.md) - Query MongoDB collections and schemas
</details>

<details>
<summary><strong>github-dev</strong> - Git workflow agents + commands</summary>

Git and GitHub automation with commit-manager, pr-manager, and pr-reviewer agents plus workflow skills.

**Agents:**

- [`code-simplifier`](./plugins/general-dev/agents/code-simplifier.md) - Ensures code follows project conventions
- [`commit-manager`](./plugins/github-dev/agents/commit-manager.md) - Git commit expert
- [`pr-manager`](./plugins/github-dev/agents/pr-manager.md) - GitHub PR workflow automation
- [`pr-reviewer`](./plugins/github-dev/agents/pr-reviewer.md) - AI-powered code review

**Commands:**

- [`/clean-gone-branches`](./plugins/github-dev/commands/clean-gone-branches.md) - Clean up deleted remote branches
- [`/commit-staged`](./plugins/github-dev/commands/commit-staged.md) - Commit changes with context
- [`/create-pr`](./plugins/github-dev/commands/create-pr.md) - Create pull request with context
- [`/update-pr-summary`](./plugins/github-dev/commands/update-pr-summary.md) - Update PR description with generated summary

**Hooks:**

- [`git_commit_confirm.py`](./plugins/github-dev/hooks/scripts/git_commit_confirm.py) - Confirmation modal before commits
- [`gh_pr_create_confirm.py`](./plugins/github-dev/hooks/scripts/gh_pr_create_confirm.py) - Confirmation modal before PR creation

**Skills:**

- [`pr-workflow`](./plugins/github-dev/skills/pr-workflow/SKILL.md) - Complete PR creation workflow
- [`commit-workflow`](./plugins/github-dev/skills/commit-workflow/SKILL.md) - Commit best practices and automation

</details>

<details>
<summary><strong>websearch-tools</strong> - Tavily web search + hooks</summary>

Tavily MCP server for web search and content extraction with Tavily hooks and usage skill.

**Hooks:**

- [`webfetch_to_tavily_extract.py`](./plugins/websearch-tools/hooks/scripts/webfetch_to_tavily_extract.py) - Redirect WebFetch
- [`websearch_to_tavily_search.py`](./plugins/websearch-tools/hooks/scripts/websearch_to_tavily_search.py) - Redirect WebSearch
- [`tavily_extract_to_advanced.py`](./plugins/websearch-tools/hooks/scripts/tavily_extract_to_advanced.py) - Auto-enable advanced extraction

**MCPs:** Tavily, Context7

**Skills:**

- [`tavily-usage`](./plugins/websearch-tools/skills/tavily-usage/SKILL.md) - Web search and content extraction workflows
</details>

<details>
<summary><strong>general-dev</strong> - Code simplifier + utilities</summary>

Code quality agent, architecture pattern command, and general utility hooks.

**Agent:**

- [`code-simplifier`](./plugins/general-dev/agents/code-simplifier.md) - Ensures code follows conventions

**Command:**

- [`/explain-architecture-pattern`](./plugins/general-dev/commands/explain-architecture-pattern.md) - Identify design patterns

**Hooks:**

- [`enforce_rg_over_grep.py`](./plugins/general-dev/hooks/scripts/enforce_rg_over_grep.py) - Suggest ripgrep
- [`notify.sh`](./plugins/general-dev/hooks/scripts/notify.sh) - OS notifications

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

**Commands:**

- [`/plugin-dev:create-plugin`](./plugins/plugin-dev/commands/create-plugin.md) - 8-phase guided plugin workflow
- [`/plugin-dev:load-skills`](./plugins/plugin-dev/commands/load-skills.md) - Load all plugin development skills

**Hooks:**

- [`validate_skill.py`](./plugins/plugin-dev/hooks/scripts/validate_skill.py) - Validates SKILL.md structure
- [`validate_mcp_hook_locations.py`](./plugins/plugin-dev/hooks/scripts/validate_mcp_hook_locations.py) - Validates MCP/hook file locations
- [`validate_plugin_paths.py`](./plugins/plugin-dev/hooks/scripts/validate_plugin_paths.py) - Validates plugin.json paths
- [`validate_plugin_structure.py`](./plugins/plugin-dev/hooks/scripts/validate_plugin_structure.py) - Validates plugin directory structure
- [`sync_marketplace_to_plugins.py`](./plugins/plugin-dev/hooks/scripts/sync_marketplace_to_plugins.py) - Syncs marketplace.json to plugin.json

</details>

<details>
<summary><strong>claude-tools</strong> - Sync CLAUDE.md + allowlist + context refresh</summary>

Commands for syncing CLAUDE.md and permissions allowlist from repository, plus context refresh for long conversations.

**Commands:**

- [`/load-claude-md`](./plugins/claude-tools/commands/load-claude-md.md) - Refresh context with CLAUDE.md instructions
- [`/load-frontend-skill`](./plugins/claude-tools/commands/load-frontend-skill.md) - Load frontend design skill from Anthropic
- [`/sync-claude-md`](./plugins/claude-tools/commands/sync-claude-md.md) - Sync CLAUDE.md from GitHub
- [`/sync-allowlist`](./plugins/claude-tools/commands/sync-allowlist.md) - Sync permissions allowlist

</details>

---

## Configuration

<details>
<summary><strong>Claude Code</strong></summary>

Configuration in [`.claude/settings.json`](./.claude/settings.json):

- **Model**: OpusPlan mode (plan: Opus 4.5, execute: Opus 4.5, fast: Sonnet 4.5) - [source](https://github.com/anthropics/claude-code/blob/4dc23d0275ff615ba1dccbdd76ad2b12a3ede591/CHANGELOG.md?plain=1#L61)
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
<summary><strong>Kimi K2</strong></summary>

Run Claude Code with [Kimi K2](https://moonshotai.github.io/Kimi-K2/) via Anthropic-compatible API - [source](https://platform.moonshot.ai/docs/guide/agent-support):

- **Thinking model**: `kimi-k2-thinking-turbo` - High-speed thinking, 256K context
- **Fast model**: `kimi-k2-turbo-preview` - Without extended thinking
- **API key**: Get from [platform.moonshot.ai](https://platform.moonshot.ai)

```bash
export ANTHROPIC_BASE_URL="https://api.moonshot.ai/anthropic/"
export ANTHROPIC_API_KEY="your-moonshot-api-key"
export ANTHROPIC_MODEL=kimi-k2-thinking-turbo
export ANTHROPIC_DEFAULT_OPUS_MODEL=kimi-k2-thinking-turbo
export ANTHROPIC_DEFAULT_SONNET_MODEL=kimi-k2-thinking-turbo
export ANTHROPIC_DEFAULT_HAIKU_MODEL=kimi-k2-thinking-turbo
export CLAUDE_CODE_SUBAGENT_MODEL=kimi-k2-thinking-turbo
```

</details>

<details>
<summary><strong>OpenAI Codex</strong></summary>

Configuration in [`~/.codex/config.toml`](./config.toml):

- **Model**: `gpt-5-codex` with `model_reasoning_effort` set to "high"
- **Provider**: Azure via `responses` API surface
- **Auth**: Project-specific base URL with `env_key` authentication

</details>

<details>
<summary><strong>ccproxy (Use Claude Code with Any LLM)</strong></summary>

Assign any API or model to any task type via [ccproxy](https://github.com/starbased-co/ccproxy):

- **MAX/Pro subscription**: Uses OAuth from your Claude subscription (no API keys)
- **Any provider**: OpenAI, Gemini, Perplexity, local LLMs, or any OpenAI-compatible API
- **Fully customizable**: Assign different models to default, thinking, planning, background tasks
- **SDK support**: Works with Anthropic SDK and LiteLLM SDK beyond Claude Code

</details>

<details>
<summary><strong>VSCode</strong></summary>

Settings in [`.vscode/settings.json`](./.vscode/settings.json):

- **GitHub Copilot**: Custom instructions for automated commit messages and PR descriptions
- **Python**: Ruff formatting with auto-save and format-on-save enabled
- **Terminal**: Cross-platform compatibility configurations

</details>

## Statusline

<img src="https://github.com/user-attachments/assets/6677e1bd-7803-4dab-8f42-ecf7454c7d26" width="400">

Real-time usage tracking powered by [ccusage](https://ccusage.com/).

<details>
<summary><strong>Configuration</strong></summary>

- [`.claude/settings.json`](./.claude/settings.json) - Statusline command
- [`.claude/ccusage.json`](./.claude/ccusage.json) - Locale, timezone, refresh settings

See [ccusage statusline guide](https://ccusage.com/guide/statusline) for setup.

</details>

## References

- [Claude Code](https://github.com/anthropics/claude-code) - Official CLI for Claude
- [Anthropic Skills](https://github.com/anthropics/skills) - Official skill examples

## Thank you for the support!

[![Star History Chart](https://api.star-history.com/svg?repos=fcakyon/claude-codex-settings&type=Date)](https://www.star-history.com/#fcakyon/claude-codex-settings&Date)
