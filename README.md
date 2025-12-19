<div align="center">
  <img src="https://github.com/user-attachments/assets/a978cb0a-785d-4a7d-aff2-7e962edd3120" width="10000" alt="Claude Codex Settings Logo">

[![Mentioned in Awesome Claude Code](https://awesome.re/mentioned-badge-flat.svg)](https://github.com/hesreallyhim/awesome-claude-code)
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

# Install plugins (pick what you need)
/plugin install azure-tools@fcakyon-claude-plugins        # Azure MCP & Skills (40+ services)
/plugin install ccproxy-tools@fcakyon-claude-plugins      # Use any LLM via ccproxy/LiteLLM
/plugin install claude-tools@fcakyon-claude-plugins       # Sync CLAUDE.md + allowlist
/plugin install gcloud-tools@fcakyon-claude-plugins       # GCloud MCP & Skills
/plugin install general-dev@fcakyon-claude-plugins        # Code simplifier + utilities
/plugin install github-dev@fcakyon-claude-plugins         # Git workflow + GitHub MCP
/plugin install linear-tools@fcakyon-claude-plugins       # Linear MCP & Skills
/plugin install mongodb-tools@fcakyon-claude-plugins      # MongoDB MCP & Skills (read-only)
/plugin install notification-tools@fcakyon-claude-plugins # OS notifications
/plugin install paper-search-tools@fcakyon-claude-plugins # Paper Search MCP & Skills
/plugin install playwright-tools@fcakyon-claude-plugins   # Playwright MCP + E2E skill
/plugin install plugin-dev@fcakyon-claude-plugins         # Plugin development toolkit
/plugin install slack-tools@fcakyon-claude-plugins        # Slack MCP & Skills
/plugin install supabase-tools@fcakyon-claude-plugins     # Supabase MCP & Skills
/plugin install tavily-tools@fcakyon-claude-plugins       # Tavily MCP & Skills
/plugin install ultralytics-dev@fcakyon-claude-plugins    # Auto-formatting hooks
```

After installing MCP plugins, run `/plugin-name:setup` for configuration (e.g., `/slack-tools:setup`).

Then create symlink for cross-tool compatibility:

```bash
ln -s CLAUDE.md AGENTS.md
```

Restart Claude Code to activate.

## Plugins

<details>
<summary><strong>azure-tools</strong> - Azure MCP & Skills</summary>

40+ Azure services with Azure CLI authentication. Run `/azure-tools:setup` after install.

**Skills:**

- [`azure-usage`](./plugins/azure-tools/skills/azure-usage/SKILL.md) - Best practices for Azure
- [`setup`](./plugins/azure-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/azure-tools:setup`](./plugins/azure-tools/commands/setup.md) - Configure Azure MCP

**MCP:** [`.mcp.json`](./plugins/azure-tools/.mcp.json) | [microsoft/mcp/Azure.Mcp.Server](https://github.com/microsoft/mcp/tree/main/servers/Azure.Mcp.Server)

</details>

<details>
<summary><strong>ccproxy-tools</strong> - Use Claude Code with any LLM</summary>

Configure Claude Code to use ccproxy/LiteLLM with Claude Pro/Max subscription, GitHub Copilot, or other providers. Run `/ccproxy-tools:setup` after install.

**Commands:**

- [`/ccproxy-tools:setup`](./plugins/ccproxy-tools/commands/setup.md) - Configure ccproxy/LiteLLM

**Skills:**

- [`setup`](./plugins/ccproxy-tools/skills/setup/SKILL.md) - Troubleshooting guide

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

<details>
<summary><strong>gcloud-tools</strong> - GCloud MCP & Skills</summary>

Logs, metrics, and traces. Run `/gcloud-tools:setup` after install.

**Skills:**

- [`gcloud-usage`](./plugins/gcloud-tools/skills/gcloud-usage/SKILL.md) - Best practices for GCloud Logs/Metrics/Traces
- [`setup`](./plugins/gcloud-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/gcloud-tools:setup`](./plugins/gcloud-tools/commands/setup.md) - Configure GCloud MCP

**MCP:** [`.mcp.json`](./plugins/gcloud-tools/.mcp.json) | [google-cloud/observability-mcp](https://github.com/googleapis/gcloud-mcp)

</details>

<details>
<summary><strong>general-dev</strong> - Code simplifier + utilities</summary>

Code quality agent and utility hooks.

**Agent:**

- [`code-simplifier`](./plugins/general-dev/agents/code-simplifier.md) - Ensures code follows conventions

**Hooks:**

- [`enforce_rg_over_grep.py`](./plugins/general-dev/hooks/scripts/enforce_rg_over_grep.py) - Suggest ripgrep

</details>

<details>
<summary><strong>github-dev</strong> - Git workflow agents + commands</summary>

Git and GitHub automation. Run `/github-dev:setup` after install.

**Agents:**

- [`commit-creator`](./plugins/github-dev/agents/commit-creator.md) - Intelligent commit workflow
- [`pr-creator`](./plugins/github-dev/agents/pr-creator.md) - Pull request creation
- [`pr-reviewer`](./plugins/github-dev/agents/pr-reviewer.md) - Code review agent

**Commands:**

- [`/commit-staged`](./plugins/github-dev/commands/commit-staged.md) - Commit staged changes
- [`/create-pr`](./plugins/github-dev/commands/create-pr.md) - Create pull request
- [`/review-pr`](./plugins/github-dev/commands/review-pr.md) - Review pull request
- [`/clean-gone-branches`](./plugins/github-dev/commands/clean-gone-branches.md) - Clean deleted branches

</details>

<details>
<summary><strong>linear-tools</strong> - Linear MCP & Skills</summary>

Issue tracking with OAuth. Run `/linear-tools:setup` after install.

**Skills:**

- [`linear-usage`](./plugins/linear-tools/skills/linear-usage/SKILL.md) - Best practices for Linear
- [`setup`](./plugins/linear-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/linear-tools:setup`](./plugins/linear-tools/commands/setup.md) - Configure Linear MCP

**MCP:** [`.mcp.json`](./plugins/linear-tools/.mcp.json) | [Linear MCP Docs](https://linear.app/docs/mcp)

</details>

<details>
<summary><strong>mongodb-tools</strong> - MongoDB MCP & Skills</summary>

Database exploration (read-only). Run `/mongodb-tools:setup` after install.

**Skills:**

- [`mongodb-usage`](./plugins/mongodb-tools/skills/mongodb-usage/SKILL.md) - Best practices for MongoDB
- [`setup`](./plugins/mongodb-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/mongodb-tools:setup`](./plugins/mongodb-tools/commands/setup.md) - Configure MongoDB MCP

**MCP:** [`.mcp.json`](./plugins/mongodb-tools/.mcp.json) | [mongodb-js/mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server)

</details>

<details>
<summary><strong>notification-tools</strong> - OS notifications</summary>

Desktop notifications when Claude Code completes tasks.

**Hooks:**

- [`notify.sh`](./plugins/notification-tools/hooks/scripts/notify.sh) - OS notifications on task completion

</details>

<details>
<summary><strong>paper-search-tools</strong> - Paper Search MCP & Skills</summary>

Search papers across arXiv, PubMed, IEEE, Scopus, ACM. Run `/paper-search-tools:setup` after install. Requires Docker.

**Skills:**

- [`paper-search-usage`](./plugins/paper-search-tools/skills/paper-search-usage/SKILL.md) - Best practices for paper search
- [`setup`](./plugins/paper-search-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/paper-search-tools:setup`](./plugins/paper-search-tools/commands/setup.md) - Configure Paper Search MCP

**MCP:** [`.mcp.json`](./plugins/paper-search-tools/.mcp.json) | [mcp/paper-search](https://hub.docker.com/r/mcp/paper-search)

</details>

<details>
<summary><strong>playwright-tools</strong> - Playwright MCP & Skills</summary>

Browser automation via MCP. Run `/playwright-tools:setup` after install. May require `npx playwright install` for browser binaries.

**Skills:**

- [`playwright-testing`](./plugins/playwright-tools/skills/playwright-testing/SKILL.md) - E2E testing best practices

**Commands:**

- [`/playwright-tools:setup`](./plugins/playwright-tools/commands/setup.md) - Configure Playwright MCP

**MCP:** [`.mcp.json`](./plugins/playwright-tools/.mcp.json) | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)

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
<summary><strong>slack-tools</strong> - Slack MCP & Skills</summary>

Message search and channel history. Run `/slack-tools:setup` after install.

**Skills:**

- [`slack-usage`](./plugins/slack-tools/skills/slack-usage/SKILL.md) - Best practices for Slack MCP
- [`setup`](./plugins/slack-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/slack-tools:setup`](./plugins/slack-tools/commands/setup.md) - Configure Slack MCP

**MCP:** [`.mcp.json`](./plugins/slack-tools/.mcp.json) | [ubie-oss/slack-mcp-server](https://github.com/ubie-oss/slack-mcp-server)

</details>

<details>
<summary><strong>supabase-tools</strong> - Supabase MCP & Skills</summary>

Database management with OAuth. Run `/supabase-tools:setup` after install.

**Skills:**

- [`supabase-usage`](./plugins/supabase-tools/skills/supabase-usage/SKILL.md) - Best practices for Supabase MCP
- [`setup`](./plugins/supabase-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/supabase-tools:setup`](./plugins/supabase-tools/commands/setup.md) - Configure Supabase MCP

**MCP:** [`.mcp.json`](./plugins/supabase-tools/.mcp.json) | [supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp)

</details>

<details>
<summary><strong>tavily-tools</strong> - Tavily MCP & Skills</summary>

Web search and content extraction. Run `/tavily-tools:setup` after install.

**Skills:**

- [`tavily-usage`](./plugins/tavily-tools/skills/tavily-usage/SKILL.md) - Best practices for Tavily Search
- [`setup`](./plugins/tavily-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/tavily-tools:setup`](./plugins/tavily-tools/commands/setup.md) - Configure Tavily MCP

**MCP:** [`.mcp.json`](./plugins/tavily-tools/.mcp.json) | [tavily-ai/tavily-mcp](https://github.com/tavily-ai/tavily-mcp)

</details>

<details>
<summary><strong>ultralytics-dev</strong> - Auto-formatting hooks</summary>

Auto-formatting hooks for Python, JavaScript, Markdown, and Bash.

**Hooks:**

- [`format_python_docstrings.py`](./plugins/ultralytics-dev/hooks/scripts/format_python_docstrings.py) - Google-style docstring formatter
- [`python_code_quality.py`](./plugins/ultralytics-dev/hooks/scripts/python_code_quality.py) - Python code quality with ruff
- [`prettier_formatting.py`](./plugins/ultralytics-dev/hooks/scripts/prettier_formatting.py) - JavaScript/TypeScript/CSS/JSON
- [`markdown_formatting.py`](./plugins/ultralytics-dev/hooks/scripts/markdown_formatting.py) - Markdown formatting
- [`bash_formatting.py`](./plugins/ultralytics-dev/hooks/scripts/bash_formatting.py) - Bash script formatting

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

## TODO

- [ ] Update Supabase usage skill to include Supabase based Auth/Row Level Security/Table relationships and optimal query pattern skills instead of MCP skills
- [ ] App [dokploy](https://github.com/Dokploy/dokploy) tools plugin with [dokploy-mcp](https://github.com/Dokploy/mcp) server and deployment best practices skill
- [ ] Add more comprehsensive fullstack-dev plugin with various ocnfigurable skills:
  - Frontend: Next.js 16 (App Router, React 19, TypeScript)
  - Backend: FastAPI, NodeJS
  - Auth: Clerk (Auth, Email), Firebase/Firestore (Auth, DB), Supabase+Resend (Auth, DB, Email) RBAC with org:admin and org:member roles
  - Styling: Tailwind CSS v4, [shadcn/ui components](https://github.com/shadcn-ui/ui), [Radix UI primitives](https://github.com/radix-ui/primitives)
  - Monitoring: Sentry (errors, APM, session replay, structured logs)
  - Analytics: [Web Vitals + Google Analytics](https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals)
- [ ] Refactor marketplace name to `claude-settings` to make it concise
- [ ] Publish `claudesettings.com` as a comprehensive documentation for installing, using and sharing useful Claude-Code settings
- [ ] Rename plugins names to `mongodb-skills`, `github-skills` ...instead of `mongodb-tools`, `github-dev` ... for better UX


## References

- [Claude Code](https://github.com/anthropics/claude-code) - Official CLI for Claude
- [Anthropic Skills](https://github.com/anthropics/skills) - Official skill examples

## Thank you for the support!

[![Star History Chart](https://api.star-history.com/svg?repos=fcakyon/claude-codex-settings&type=Date)](https://www.star-history.com/#fcakyon/claude-codex-settings&Date)
