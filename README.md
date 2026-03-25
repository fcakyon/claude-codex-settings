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
/plugin install anthropic-essentials@claude-settings     # Anthropic feature-dev, frontend, CLAUDE.md, skills
/plugin install anthropic-creative-suite@claude-settings # Anthropic docs, theming, artifacts
/plugin install anthropic-plugin-dev@claude-settings     # Anthropic plugin development toolkit
/plugin install phd-skills@claude-settings               # Hypothesis design, paper review, citation checks
/plugin install react-skills@claude-settings             # React, Next.js, React Native best practices
/plugin install agent-browser@claude-settings            # Browser automation CLI
/plugin install web-design-guidelines@claude-settings    # UI review for accessibility, forms, performance
/plugin install github-dev@claude-settings               # Git workflow + GitHub MCP
/plugin install statusline-tools@claude-settings         # Session + 5H usage statusline
/plugin install ultralytics-dev@claude-settings          # Auto-formatting hooks
/plugin install notification-tools@claude-settings       # OS notifications
/plugin install azure-tools@claude-settings              # Azure MCP & Skills (40+ services)
/plugin install ccproxy-tools@claude-settings            # Use any LLM via ccproxy/LiteLLM
/plugin install claude-tools@claude-settings             # Sync CLAUDE.md + allowlist
/plugin install gcloud-tools@claude-settings             # GCloud MCP & Skills
/plugin install general-dev@claude-settings              # Code simplifier + utilities
/plugin install linear-tools@claude-settings             # Linear MCP & Skills
/plugin install mongodb-tools@claude-settings            # MongoDB MCP & Skills (read-only)
/plugin install paper-search-tools@claude-settings       # Paper Search MCP & Skills
/plugin install slack-tools@claude-settings              # Slack MCP & Skills
/plugin install supabase-tools@claude-settings           # Supabase MCP & Skills
/plugin install tavily-tools@claude-settings             # Tavily MCP & Skills
```

After installing MCP plugins, run `/plugin-name:setup` for configuration (e.g., `/slack-tools:setup`).

Then create symlink for cross-tool compatibility:

```bash
ln -sfn CLAUDE.md AGENTS.md
```

Restart Claude Code to activate.

## Plugins

<details>
<summary><strong>anthropic-essentials</strong> - Feature dev, frontend design, CLAUDE.md management, skill creation</summary>

Best-of bundle from [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official). Cherry-picks skills, agents, and commands from multiple upstream plugins.

**Skills:**

- `frontend-design` - Production-grade frontend interfaces with high design quality
- `claude-md-improver` - Audit and improve CLAUDE.md files across a codebase
- `skill-creator` - Create, improve, and benchmark Agent Skills with eval testing

**Agents:**

- `code-architect` - Architecture design from codebase patterns
- `code-explorer` - Deep codebase exploration and analysis
- `code-reviewer` - Code quality and review

**Commands:**

- `/feature-dev` - Guided feature development workflow
- `/revise-claude-md` - Capture session learnings into CLAUDE.md

**Hooks:**

- `Stop` (prompt) - Suggest CLAUDE.md updates after significant code changes
- `SessionEnd` (prompt) - Remind to capture learnings when session ends

</details>

<details>
<summary><strong>anthropic-creative-suite</strong> - Documents, theming, web artifacts</summary>

Selected skills from [anthropics/skills](https://github.com/anthropics/skills). Document skills are proprietary/source-available; others are Apache 2.0.

**Skills:**

- `pdf` - PDF processing (read, merge, split, create, OCR)
- `docx` - Word document creation and editing
- `pptx` - PowerPoint presentation building
- `xlsx` - Excel spreadsheet processing
- `theme-factory` - Generate themes and styling systems
- `web-artifacts-builder` - Build interactive web artifacts

</details>

<details>
<summary><strong>anthropic-plugin-dev</strong> - Plugin development toolkit</summary>

Actively maintained plugin development toolkit from [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/plugin-dev). 7 skills, 3 agents, and guided plugin creation.

**Skills:** hook-development, mcp-integration, plugin-structure, plugin-settings, command-development, agent-development, skill-development

**Agents:** agent-creator, plugin-validator, skill-reviewer

**Commands:** `/create-plugin` - Guided plugin workflow

</details>

<details>
<summary><strong>phd-skills</strong> - Hypothesis design, paper review, citation checks</summary>

Academic research toolkit from [fcakyon/phd-skills](https://github.com/fcakyon/phd-skills). Experiment design, literature review, paper writing, citation verification, and reviewer defense for PhD workflows.

**Skills:**

- [`dataset-curation`](https://github.com/fcakyon/phd-skills/blob/main/plugin/skills/dataset-curation/SKILL.md) - Dataset preparation and annotation guidelines
- [`experiment-design`](https://github.com/fcakyon/phd-skills/blob/main/plugin/skills/experiment-design/SKILL.md) - Experiment setup and ablation planning
- [`latex-setup`](https://github.com/fcakyon/phd-skills/blob/main/plugin/skills/latex-setup/SKILL.md) - LaTeX project configuration
- [`literature-research`](https://github.com/fcakyon/phd-skills/blob/main/plugin/skills/literature-research/SKILL.md) - Literature search and review
- [`paper-verification`](https://github.com/fcakyon/phd-skills/blob/main/plugin/skills/paper-verification/SKILL.md) - Citation and claim verification
- [`paper-writing`](https://github.com/fcakyon/phd-skills/blob/main/plugin/skills/paper-writing/SKILL.md) - Academic paper drafting
- [`research-publishing`](https://github.com/fcakyon/phd-skills/blob/main/plugin/skills/research-publishing/SKILL.md) - Submission and publishing workflow
- [`reviewer-defense`](https://github.com/fcakyon/phd-skills/blob/main/plugin/skills/reviewer-defense/SKILL.md) - Reviewer response preparation

**Agents:**

- [`experiment-analyzer`](https://github.com/fcakyon/phd-skills/blob/main/plugin/agents/experiment-analyzer.md) - Analyze experiment results and suggest next steps
- [`paper-auditor`](https://github.com/fcakyon/phd-skills/blob/main/plugin/agents/paper-auditor.md) - Audit paper for consistency and completeness

**Commands:**

- [`/factcheck`](https://github.com/fcakyon/phd-skills/blob/main/plugin/commands/factcheck.md) - Verify citations and claims
- [`/fortify`](https://github.com/fcakyon/phd-skills/blob/main/plugin/commands/fortify.md) - Strengthen paper against reviewer critiques
- [`/gaps`](https://github.com/fcakyon/phd-skills/blob/main/plugin/commands/gaps.md) - Find gaps in literature coverage
- [`/setup`](https://github.com/fcakyon/phd-skills/blob/main/plugin/commands/setup.md) - Configure phd-skills
- [`/xray`](https://github.com/fcakyon/phd-skills/blob/main/plugin/commands/xray.md) - Deep analysis of a paper

</details>

<details>
<summary><strong>react-skills</strong> - React, Next.js, and React Native best practices</summary>

Cherry-picked skills from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills). 64 React/Next.js rules and 35+ React Native/Expo rules covering performance, rendering, state, animations, and navigation.

**Skills:**

- `react-best-practices` - React and Next.js performance patterns: waterfalls, bundle size, server components, re-renders, rendering, JS performance, advanced patterns
- `react-native` - React Native and Expo: list virtualization, animations with Reanimated, native navigation, UI patterns, state management, monorepo config

</details>

<details>
<summary><strong>agent-browser</strong> - Browser Automation CLI for AI Agents</summary>

Browser automation via CLI instead of MCP. [93% less context usage](https://medium.com/@richardhightower/agent-browser-ai-first-browser-automation-that-saves-93-of-your-context-window-7a2c52562f8c) than Playwright MCP by using snapshot + element refs instead of full DOM tree dumps. From [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser).

**Skills:**

- `agent-browser` - Browser automation: navigation, forms, clicking, screenshots, auth, sessions, profiling, video recording

**CLI Tool:** [agent-browser](https://github.com/vercel-labs/agent-browser) — install via `npm i -g agent-browser && agent-browser install`

</details>

<details>
<summary><strong>web-design-guidelines</strong> - UI code review for web interface guidelines</summary>

Review UI code for compliance with [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines). Full ruleset inlined for offline use.

**Skills:**

- `web-design-review` - Check code against 16 rule categories: accessibility, focus states, forms, animation, typography, content handling, images, performance, navigation, touch, safe areas, dark mode, locale, hydration safety, hover states, anti-patterns

</details>

<details>
<summary><strong>github-dev</strong> - Git workflow agents + commands</summary>

Git and GitHub automation. Run `/github-dev:setup` after install.

**Agents:**

- [`commit-creator`](./plugins/github-dev/agents/commit-creator.md) - Intelligent commit workflow
- [`pr-creator`](./plugins/github-dev/agents/pr-creator.md) - Pull request creation
- [`pr-reviewer`](./plugins/github-dev/agents/pr-reviewer.md) - Code review agent
- [`pr-comment-resolver`](./plugins/github-dev/agents/pr-comment-resolver.md) - PR comment resolution

**Skills:**

- [`commit-workflow`](./plugins/github-dev/skills/commit-workflow/SKILL.md) - Commit process and message format
- [`pr-workflow`](./plugins/github-dev/skills/pr-workflow/SKILL.md) - PR creation workflow
- [`pr-comment-workflow`](./plugins/github-dev/skills/pr-comment-workflow/SKILL.md) - PR comment style and resolution
- [`setup`](./plugins/github-dev/skills/setup/SKILL.md) - GitHub CLI troubleshooting

**Commands:**

- [`/commit-staged`](./plugins/github-dev/commands/commit-staged.md) - Commit staged changes
- [`/create-pr`](./plugins/github-dev/commands/create-pr.md) - Create pull request
- [`/review-pr`](./plugins/github-dev/commands/review-pr.md) - Review pull request
- [`/resolve-pr-comments`](./plugins/github-dev/commands/resolve-pr-comments.md) - Address unresolved PR comments
- [`/update-pr-summary`](./plugins/github-dev/commands/update-pr-summary.md) - Update PR description
- [`/clean-gone-branches`](./plugins/github-dev/commands/clean-gone-branches.md) - Clean deleted branches
- [`/github-dev:setup`](./plugins/github-dev/commands/setup.md) - Configure GitHub CLI

**Hooks:**

- [`git_commit_confirm.py`](./plugins/github-dev/hooks/scripts/git_commit_confirm.py) - Confirmation before git commit
- [`gh_pr_create_confirm.py`](./plugins/github-dev/hooks/scripts/gh_pr_create_confirm.py) - Confirmation before gh pr create

</details>

<details>
<summary><strong>statusline-tools</strong> - Session + 5H Usage Statusline</summary>

Cross-platform statusline showing session context %, cost, and account-wide 5H usage with time until reset. Run `/statusline-tools:setup` after install.

**Skills:**

- [`setup`](./plugins/statusline-tools/skills/setup/SKILL.md) - Statusline configuration guide

**Commands:**

- [`/statusline-tools:setup`](./plugins/statusline-tools/commands/setup.md) - Configure statusline

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

<details>
<summary><strong>notification-tools</strong> - OS notifications</summary>

Desktop notifications when Claude Code completes tasks.

**Hooks:**

- [`notify.sh`](./plugins/notification-tools/hooks/scripts/notify.sh) - OS notifications on task completion

</details>

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
- [`/sync-claude-md`](./plugins/claude-tools/commands/sync-claude-md.md) - Sync CLAUDE.md from GitHub
- [`/sync-allowlist`](./plugins/claude-tools/commands/sync-allowlist.md) - Sync permissions allowlist

**Hooks:**

- [`sync_marketplace_to_plugins.py`](./plugins/claude-tools/hooks/scripts/sync_marketplace_to_plugins.py) - Syncs marketplace.json to plugin.json

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

**Hooks:**

- [`webfetch_to_tavily_extract.py`](./plugins/tavily-tools/hooks/scripts/webfetch_to_tavily_extract.py) - Redirect WebFetch to Tavily extract
- [`websearch_to_tavily_search.py`](./plugins/tavily-tools/hooks/scripts/websearch_to_tavily_search.py) - Redirect WebSearch to Tavily search
- [`tavily_extract_to_advanced.py`](./plugins/tavily-tools/hooks/scripts/tavily_extract_to_advanced.py) - Upgrade Tavily extract depth

**MCP:** [`.mcp.json`](./plugins/tavily-tools/.mcp.json) | [tavily-ai/tavily-mcp](https://github.com/tavily-ai/tavily-mcp)

</details>

---

## Configuration

<details>
<summary><strong>Claude Code</strong></summary>

Configuration in [`.claude/settings.json`](./.claude/settings.json):

- **Model**: OpusPlan mode (plan: Opus 4.6, execute: Opus 4.6, fast: Sonnet 4.6) - [source](https://github.com/anthropics/claude-code/blob/4dc23d0275ff615ba1dccbdd76ad2b12a3ede591/CHANGELOG.md?plain=1#L61)
- **Environment**: bash working directory, telemetry disabled, MCP output limits
- **Permissions**: bash commands, git operations, MCP tools
- **Statusline**: Custom usage tracking powered by [ccusage](https://ccusage.com/)
- **Plugins**: All plugins enabled

</details>

<details>
<summary><strong>Z.ai (85% cheaper)</strong></summary>

Configuration in [`.claude/settings-zai.json`](./.claude/settings-zai.json) using [Z.ai GLM models via Anthropic-compatible API](https://docs.z.ai/scenario-example/develop-tools/claude):

- **Main model**: GLM-5-Turbo (dialogue, planning, coding, complex reasoning)
- **Fast model**: GLM-4.7-Flash (file search, syntax checking)
- **Cost savings**: 85% cheaper than Claude 4.6 - [source](https://z.ai/blog/glm-4.6)
- **API key**: Get from [z.ai/model-api](https://z.ai/model-api)

</details>

<details>
<summary><strong>Kimi K2.5</strong></summary>

Run Claude Code with [Kimi K2.5](https://www.kimi.com/blog/kimi-k2-5) via Anthropic-compatible API - [source](https://platform.moonshot.ai/docs/guide/agent-support):

- **Model**: `kimi-k2.5` - High-speed thinking, 256K context
- **API key**: Get from [platform.moonshot.ai](https://platform.moonshot.ai)

```bash
export ANTHROPIC_BASE_URL=https://api.moonshot.ai/anthropic
export ANTHROPIC_AUTH_TOKEN="your-moonshot-api-key"
export ANTHROPIC_MODEL=kimi-k2.5
export ANTHROPIC_DEFAULT_OPUS_MODEL=kimi-k2.5
export ANTHROPIC_DEFAULT_SONNET_MODEL=kimi-k2.5
export ANTHROPIC_DEFAULT_HAIKU_MODEL=kimi-k2.5
export CLAUDE_CODE_SUBAGENT_MODEL=kimi-k2.5
export ENABLE_TOOL_SEARCH=false
```

</details>

<details>
<summary><strong>OpenAI Codex</strong></summary>

Configuration in [`~/.codex/config.toml`](./.codex/config.toml):

- **Model**: `gpt-5.4` with `model_reasoning_effort` set to "high"
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

Simple statusline plugin that uses the official usage API to show account-wide block usage and reset time in real-time. Works for both API and subscription users.

<a href="https://github.com/fcakyon/claude-codex-settings?tab=readme-ov-file#statusline" target="_blank" rel="noopener noreferrer">
  <img src="https://github.com/user-attachments/assets/7bbb8e98-2755-46be-b0a4-cc8367a58fdb" width="600">
</a>

<details>
<summary><strong>Setup</strong></summary>

```bash
/plugin marketplace add fcakyon/claude-codex-settings
/plugin install statusline-tools@claude-settings
/statusline-tools:setup
```

**Color coding:**

- 🟢 <50% usage / <1h until reset
- 🟡 50-70% usage / 1-3.5h until reset
- 🔴 70%+ usage / >3.5h until reset

See [Claude Code statusline docs](https://code.claude.com/docs/en/statusline) for details.

</details>

## TODO

- [ ] App [dokploy](https://github.com/Dokploy/dokploy) tools plugin with [dokploy-mcp](https://github.com/Dokploy/mcp) server and deployment best practices skill
- [ ] Add more comprehsensive fullstack-dev plugin with various ocnfigurable skills:
  - Backend: FastAPI, NodeJS
  - Auth: Clerk (Auth, Email), Firebase/Firestore (Auth, DB), Supabase+Resend (Auth, DB, Email) RBAC with org:admin and org:member roles
  - Styling: Tailwind CSS v4, [shadcn/ui components](https://github.com/shadcn-ui/ui), [Radix UI primitives](https://github.com/radix-ui/primitives)
  - Monitoring: Sentry (errors, APM, session replay, structured logs)
  - Analytics: [Web Vitals + Google Analytics](https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals)
- [ ] Publish `claudesettings.com` as a comprehensive documentation for installing, using and sharing useful Claude-Code settings
- [ ] Rename plugins names to `mongodb-skills`, `github-skills` ...instead of `mongodb-tools`, `github-dev` ... for better UX
- [ ] Add worktree support to github-dev create-pr and commit-staged commands for easier work on multiple branches of the same repo simultaneously
- [ ] Add current repo branch and worktree info into statusline-tools plugin

## References

- [Claude Code](https://github.com/anthropics/claude-code) - Official CLI for Claude
- [Anthropic Skills](https://github.com/anthropics/skills) - Official skill examples

## Thank you for the support!

[![Star History Chart](https://api.star-history.com/svg?repos=fcakyon/claude-codex-settings&type=Date)](https://www.star-history.com/#fcakyon/claude-codex-settings&Date)
