<div align="center">
  <img src="https://github.com/user-attachments/assets/a978cb0a-785d-4a7d-aff2-7e962edd3120" width="10000" alt="Claude Codex Settings Logo">

[![Mentioned in Awesome Claude Code](https://awesome.re/mentioned-badge-flat.svg)](https://github.com/hesreallyhim/awesome-claude-code)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Plugin-blue)](#installation)
[![Codex CLI](https://img.shields.io/badge/Codex_CLI-Plugin-green)](#installation)
[![Gemini CLI](https://img.shields.io/badge/Gemini_CLI-Extension-orange)](#installation)
[![Cursor](https://img.shields.io/badge/Cursor-Plugin-purple)](#installation)
[![Context7 MCP](https://img.shields.io/badge/Context7%20MCP-Indexed-blue)](https://context7.com/fcakyon/claude-codex-settings)
[![llms.txt](https://img.shields.io/badge/llms.txt-✓-brightgreen)](https://context7.com/fcakyon/claude-codex-settings/llms.txt)

My daily battle-tested Claude [Code](https://github.com/anthropics/claude-code)/[Desktop](https://claude.ai/download) and [OpenAI Codex](https://developers.openai.com/codex) setup with skills, commands, hooks, subagents and MCP servers.

[Installation](#installation) • [Plugins](#plugins) • [Configuration](#configuration) • [References](#references)

</div>

## Installation

Plugins add skills, commands, and automations to your AI coding tool. Install only what you need from the plugin list below.

> **Prerequisites:** See [INSTALL.md](INSTALL.md) for setup requirements.

<details open>
<summary><strong>Claude Code</strong></summary>

```bash
# Add marketplace (one time)
/plugin marketplace add fcakyon/claude-codex-settings

# Install any plugin by name
/plugin install < plugin-name > @claude-settings
```

After installing, run `/plugin-name:setup` for configuration (e.g., `/gcloud-tools:setup`).

</details>

<details>
<summary><strong>Codex CLI</strong></summary>

```bash
codex plugin install < plugin-name > @claude-settings
```

</details>

<details>
<summary><strong>Gemini CLI</strong></summary>

```bash
gemini extensions install --path ./plugins/<plugin-name>
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

```bash
cursor plugin install < plugin-name > @claude-settings
```

</details>

Create symlinks for cross-tool compatibility:

```bash
ln -sfn CLAUDE.md AGENTS.md
ln -sfn CLAUDE.md GEMINI.md
```

## Plugins

<details>
<summary><strong>anthropic-office-skills</strong> - Official Anthropic PDF, Word, PowerPoint, Excel skills</summary>

Official office document skills from [anthropics/skills](https://github.com/anthropics/skills). Synced locally via `bash .github/scripts/sync-anthropic-office-skills.sh`.

| Skill                                                            | Description                                             | Install                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`pdf`](./plugins/anthropic-office-skills/skills/pdf/SKILL.md)   | PDF processing (read, merge, split, create, OCR, forms) | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/pdf.zip)  |
| [`pptx`](./plugins/anthropic-office-skills/skills/pptx/SKILL.md) | PowerPoint presentation building and editing            | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/pptx.zip) |
| [`xlsx`](./plugins/anthropic-office-skills/skills/xlsx/SKILL.md) | Excel spreadsheet processing with formulas              | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/xlsx.zip) |
| [`docx`](./plugins/anthropic-office-skills/skills/docx/SKILL.md) | Word document creation and editing                      | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/docx.zip) |

</details>

<details>
<summary><strong>openai-office-skills</strong> - Official OpenAI PDF, Word, PowerPoint, Excel skills</summary>

Official office document skills from [openai/skills](https://github.com/openai/skills). Synced locally via `bash .github/scripts/sync-openai-office-skills.sh`.

| Skill                                                                       | Description                                         | Install                                                                                                                                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`pdf`](./plugins/openai-office-skills/skills/pdf/SKILL.md)                 | PDF generation and extraction with visual review    | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/pdf.zip)         |
| [`slides`](./plugins/openai-office-skills/skills/slides/SKILL.md)           | Slide deck creation with PptxGenJS                  | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/slides.zip)      |
| [`spreadsheet`](./plugins/openai-office-skills/skills/spreadsheet/SKILL.md) | Spreadsheet processing with formulas and formatting | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/spreadsheet.zip) |
| [`doc`](./plugins/openai-office-skills/skills/doc/SKILL.md)                 | Word document creation and editing                  | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/doc.zip)         |

</details>

<details>
<summary><strong>react-skills</strong> - Official React, Next.js, and React Native best practices</summary>

| Claude Code                                    | Codex CLI                                           | Gemini CLI                                                |
| ---------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| `/plugin install react-skills@claude-settings` | `codex plugin install react-skills@claude-settings` | `gemini extensions install --path ./plugins/react-skills` |

React and frontend best practices synced from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                                     | Description                                                            | ZIP                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`composition-patterns`](./plugins/react-skills/skills/composition-patterns/SKILL.md)     | React composition patterns: compound components, render props, context | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/composition-patterns.zip)   |
| [`react-best-practices`](./plugins/react-skills/skills/react-best-practices/SKILL.md)     | 64 React/Next.js performance rules from Vercel Engineering             | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/react-best-practices.zip)   |
| [`react-native-skills`](./plugins/react-skills/skills/react-native-skills/SKILL.md)       | 35+ React Native/Expo rules for performance and animations             | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/react-native-skills.zip)    |
| [`react-view-transitions`](./plugins/react-skills/skills/react-view-transitions/SKILL.md) | View Transition API for page/route animations                          | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/react-view-transitions.zip) |
| [`web-design-guidelines`](./plugins/react-skills/skills/web-design-guidelines/SKILL.md)   | UI review against 16 web interface guideline categories                | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/web-design-guidelines.zip)  |

</details>

<details>
<summary><strong>agent-browser</strong> - Official browser automation CLI for AI agents</summary>

| Claude Code                                     | Codex CLI                                            | Gemini CLI                                                 |
| ----------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `/plugin install agent-browser@claude-settings` | `codex plugin install agent-browser@claude-settings` | `gemini extensions install --path ./plugins/agent-browser` |

Browser automation via CLI instead of MCP. [93% less context usage](https://medium.com/@richardhightower/agent-browser-ai-first-browser-automation-that-saves-93-of-your-context-window-7a2c52562f8c) than Playwright MCP by using snapshot + element refs instead of full DOM tree dumps. Synced from [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                    | Description                                                                  | ZIP                                                                                                                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`agent-browser`](./plugins/agent-browser/skills/agent-browser/SKILL.md) | Browser automation: navigation, forms, clicking, screenshots, auth, sessions | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/agent-browser.zip) |
| [`electron`](./plugins/agent-browser/skills/electron/SKILL.md)           | Automate Electron desktop apps (VS Code, Slack, Discord, Figma, Notion)      | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/electron.zip)      |

**CLI Tool:** [agent-browser](https://github.com/vercel-labs/agent-browser) - install via `npm i -g agent-browser && agent-browser install`

</details>

<details>
<summary><strong>frontend-design-skills</strong> - Official frontend design skills (Anthropic + OpenAI)</summary>

Frontend design skills from [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) and [openai/skills](https://github.com/openai/skills). Synced locally via `bash .github/scripts/sync-frontend-skills.sh`.

| Skill                                                                                                     | Description                                                                       | Install                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`openai-frontend-design`](./plugins/frontend-design-skills/skills/openai-frontend-design/SKILL.md)       | Composition-first design: restrained layout, image-led hierarchy, tasteful motion | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/openai-frontend-design.zip)    |
| [`anthropic-frontend-design`](./plugins/frontend-design-skills/skills/anthropic-frontend-design/SKILL.md) | Bold aesthetic direction, distinctive typography, anti-generic AI aesthetics      | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/anthropic-frontend-design.zip) |

</details>

<details>
<summary><strong>mongodb-skills</strong> - Official MongoDB agent skills for schema design, query tuning, and Atlas Search</summary>

| Claude Code                                      | Codex CLI                                             | Gemini CLI                                                  |
| ------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------- |
| `/plugin install mongodb-skills@claude-settings` | `codex plugin install mongodb-skills@claude-settings` | `gemini extensions install --path ./plugins/mongodb-skills` |

Official MongoDB agent skills for schema design, query tuning, Atlas Search, and connections. Synced from [mongodb/agent-skills](https://github.com/mongodb/agent-skills).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                                                             | Description                      | ZIP                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`atlas-stream-processing`](./plugins/mongodb-skills/skills/atlas-stream-processing/SKILL.md)                     | Atlas stream processing patterns | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/atlas-stream-processing.zip)           |
| [`mongodb-connection`](./plugins/mongodb-skills/skills/mongodb-connection/SKILL.md)                               | Connection management            | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/mongodb-connection.zip)                |
| [`mongodb-mcp-setup`](./plugins/mongodb-skills/skills/mongodb-mcp-setup/SKILL.md)                                 | MCP server setup                 | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/mongodb-mcp-setup.zip)                 |
| [`mongodb-natural-language-querying`](./plugins/mongodb-skills/skills/mongodb-natural-language-querying/SKILL.md) | Natural language to queries      | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/mongodb-natural-language-querying.zip) |
| [`mongodb-query-optimizer`](./plugins/mongodb-skills/skills/mongodb-query-optimizer/SKILL.md)                     | Query performance tuning         | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/mongodb-query-optimizer.zip)           |
| [`mongodb-schema-design`](./plugins/mongodb-skills/skills/mongodb-schema-design/SKILL.md)                         | Schema design patterns           | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/mongodb-schema-design.zip)             |
| [`mongodb-search-and-ai`](./plugins/mongodb-skills/skills/mongodb-search-and-ai/SKILL.md)                         | Atlas Search and AI integration  | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/mongodb-search-and-ai.zip)             |

</details>

<details>
<summary><strong>supabase-skills</strong> - Official Supabase agent skills for Postgres query and schema best practices</summary>

| Claude Code                                       | Codex CLI                                              | Gemini CLI                                                   |
| ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| `/plugin install supabase-skills@claude-settings` | `codex plugin install supabase-skills@claude-settings` | `gemini extensions install --path ./plugins/supabase-skills` |

Official Supabase agent skills for Postgres query performance and schema design across 8 categories. Synced from [supabase/agent-skills](https://github.com/supabase/agent-skills).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                                                            | Description                                                | ZIP                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`supabase-postgres-best-practices`](./plugins/supabase-skills/skills/supabase-postgres-best-practices/SKILL.md) | Postgres performance and schema design across 8 categories | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/supabase-postgres-best-practices.zip) |

</details>

<details>
<summary><strong>stripe-skills</strong> - Official Stripe agent skills for payments, billing, Connect, and API upgrades</summary>

| Claude Code                                     | Codex CLI                                            | Gemini CLI                                                 |
| ----------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `/plugin install stripe-skills@claude-settings` | `codex plugin install stripe-skills@claude-settings` | `gemini extensions install --path ./plugins/stripe-skills` |

Official Stripe agent skills for payment integration: API selection, Connect platform setup, billing/subscriptions, Treasury, and SDK upgrades. Synced from [stripe/ai](https://github.com/stripe/ai).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                                    | Description                                                     | ZIP                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`stripe-best-practices`](./plugins/stripe-skills/skills/stripe-best-practices/SKILL.md) | Payments, billing, Connect, Treasury integration best practices | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/stripe-best-practices.zip) |
| [`stripe-projects`](./plugins/stripe-skills/skills/stripe-projects/SKILL.md)             | Stripe Projects CLI setup and stack provisioning                | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/stripe-projects.zip)       |
| [`upgrade-stripe`](./plugins/stripe-skills/skills/upgrade-stripe/SKILL.md)               | Stripe API version and SDK upgrade guide                        | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/upgrade-stripe.zip)        |

</details>

<details>
<summary><strong>polar-skills</strong> - Official Polar agent skills for billing, subscriptions, and local dev environment</summary>

| Claude Code                                    | Codex CLI                                           | Gemini CLI                                                |
| ---------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| `/plugin install polar-skills@claude-settings` | `codex plugin install polar-skills@claude-settings` | `gemini extensions install --path ./plugins/polar-skills` |

Official Polar agent skills for billing system, Stripe integration, subscription lifecycle, and local dev with Docker. Synced from [polarsource/polar](https://github.com/polarsource/polar).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                                       | Description                                                                   | ZIP                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`polar-billing`](./plugins/polar-skills/skills/polar-billing/SKILL.md)                     | Polar billing system, Stripe integration, subscriptions, benefit provisioning | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/polar-billing.zip)           |
| [`polar-local-environment`](./plugins/polar-skills/skills/polar-local-environment/SKILL.md) | Polar local development environment with Docker                               | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/polar-local-environment.zip) |

</details>

<details>
<summary><strong>anthropic-essentials</strong> - Feature dev, CLAUDE.md management, skill creation</summary>

Best-of bundle from [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official). Cherry-picks skills, agents, and commands from multiple upstream plugins.

**Skills:**

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
<summary><strong>github-dev</strong> - Git workflow agents + commands</summary>

| Claude Code                                  | Codex CLI                                         | Gemini CLI                                              |
| -------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| `/plugin install github-dev@claude-settings` | `codex plugin install github-dev@claude-settings` | `gemini extensions install --path ./plugins/github-dev` |

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
<summary><strong>ultralytics-dev</strong> - Auto-formatting hooks</summary>

| Claude Code                                       | Codex CLI                                              | Gemini CLI                                                   |
| ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| `/plugin install ultralytics-dev@claude-settings` | `codex plugin install ultralytics-dev@claude-settings` | `gemini extensions install --path ./plugins/ultralytics-dev` |

Auto-formatting hooks for Python, JavaScript, Markdown, and Bash.

**Hooks:**

- [`format_python_docstrings.py`](./plugins/ultralytics-dev/hooks/scripts/format_python_docstrings.py) - Google-style docstring formatter
- [`python_code_quality.py`](./plugins/ultralytics-dev/hooks/scripts/python_code_quality.py) - Python code quality with ruff
- [`prettier_formatting.py`](./plugins/ultralytics-dev/hooks/scripts/prettier_formatting.py) - JavaScript/TypeScript/CSS/JSON
- [`markdown_formatting.py`](./plugins/ultralytics-dev/hooks/scripts/markdown_formatting.py) - Markdown formatting
- [`bash_formatting.py`](./plugins/ultralytics-dev/hooks/scripts/bash_formatting.py) - Bash script formatting

</details>

<details>
<summary><strong>azure-tools</strong> - Azure MCP & Skills</summary>

| Claude Code                                   | Codex CLI                                          | Gemini CLI                                               |
| --------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `/plugin install azure-tools@claude-settings` | `codex plugin install azure-tools@claude-settings` | `gemini extensions install --path ./plugins/azure-tools` |

40+ Azure services with Azure CLI authentication. Run `/azure-tools:setup` after install.

**Skills:**

- [`azure-usage`](./plugins/azure-tools/skills/azure-usage/SKILL.md) - Best practices for Azure
- [`setup`](./plugins/azure-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/azure-tools:setup`](./plugins/azure-tools/commands/setup.md) - Configure Azure MCP

**MCP:** [`.mcp.json`](./plugins/azure-tools/.mcp.json) | [microsoft/mcp/Azure.Mcp.Server](https://github.com/microsoft/mcp/tree/main/servers/Azure.Mcp.Server)

</details>

<details>
<summary><strong>claude-tools</strong> - Sync CLAUDE.md + allowlist + context refresh</summary>

| Claude Code                                    | Codex CLI                                           | Gemini CLI                                                |
| ---------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| `/plugin install claude-tools@claude-settings` | `codex plugin install claude-tools@claude-settings` | `gemini extensions install --path ./plugins/claude-tools` |

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

| Claude Code                                    | Codex CLI                                           | Gemini CLI                                                |
| ---------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| `/plugin install gcloud-tools@claude-settings` | `codex plugin install gcloud-tools@claude-settings` | `gemini extensions install --path ./plugins/gcloud-tools` |

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

| Claude Code                                   | Codex CLI                                          | Gemini CLI                                               |
| --------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `/plugin install general-dev@claude-settings` | `codex plugin install general-dev@claude-settings` | `gemini extensions install --path ./plugins/general-dev` |

Code quality agent and utility hooks.

**Agent:**

- [`code-simplifier`](./plugins/general-dev/agents/code-simplifier.md) - Ensures code follows conventions

**Hooks:**

- [`enforce_rg_over_grep.py`](./plugins/general-dev/hooks/scripts/enforce_rg_over_grep.py) - Suggest ripgrep

</details>

<details>
<summary><strong>paper-search-tools</strong> - Paper Search MCP & Skills</summary>

| Claude Code                                          | Codex CLI                                                 | Gemini CLI                                                      |
| ---------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| `/plugin install paper-search-tools@claude-settings` | `codex plugin install paper-search-tools@claude-settings` | `gemini extensions install --path ./plugins/paper-search-tools` |

Search papers across arXiv, PubMed, IEEE, Scopus, ACM. Run `/paper-search-tools:setup` after install. Requires Docker.

**Skills:**

- [`paper-search-usage`](./plugins/paper-search-tools/skills/paper-search-usage/SKILL.md) - Best practices for paper search
- [`setup`](./plugins/paper-search-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/paper-search-tools:setup`](./plugins/paper-search-tools/commands/setup.md) - Configure Paper Search MCP

**MCP:** [`.mcp.json`](./plugins/paper-search-tools/.mcp.json) | [mcp/paper-search](https://hub.docker.com/r/mcp/paper-search)

</details>

<details>
<summary><strong>tavily-tools</strong> - Tavily MCP & Skills</summary>

| Claude Code                                    | Codex CLI                                           | Gemini CLI                                                |
| ---------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| `/plugin install tavily-tools@claude-settings` | `codex plugin install tavily-tools@claude-settings` | `gemini extensions install --path ./plugins/tavily-tools` |

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
<summary><strong>VSCode</strong></summary>

Settings in [`.vscode/settings.json`](./.vscode/settings.json):

- **GitHub Copilot**: Custom instructions for automated commit messages and PR descriptions
- **Python**: Ruff formatting with auto-save and format-on-save enabled
- **Terminal**: Cross-platform compatibility configurations

</details>

## TODO

**Visual demos:**

- [ ] Add before/after comparison slider images or GIFs for each plugin showing the value visually

**Zero-MCP goal:**

- [ ] Replace MCP-based plugins with CLI alternatives where possible (mongodb, tavily, gcloud, azure, linear, supabase, paper-search)

**New plugins/skills:**

- [x] Payments: [Stripe](https://stripe.com) best practices, [Polar](https://polar.sh) billing and local dev
- [ ] Payments: [Paddle](https://www.paddle.com) billing and checkout skills
- [ ] Deployment: [Dokploy](https://github.com/Dokploy/dokploy) deployment skill
- [x] Frontend design: Anthropic + OpenAI frontend design skills (bundled as `frontend-design-skills`)
- [ ] Frontend: [TanStack](https://tanstack.com) (Router, Query, Table, Form)
- [ ] Real-time: [LiveKit](https://livekit.io) voice/video agent skill
- [x] Documents: Google Docs, PPTX, DOCX, Excel from OpenAI (bundled as `openai-office-skills`)
- [ ] Auth: Clerk, Firebase, Supabase Auth patterns
- [ ] Fullstack: FastAPI, NodeJS backends, Tailwind CSS v4, [shadcn/ui](https://github.com/shadcn-ui/ui), Sentry monitoring, [Web Vitals](https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals)

**Static website:**

- [ ] Publish plugin catalog site with search, category filtering, and per-tool install snippets

**Other:**

- [ ] Rename plugins to `mongodb-skills`, `github-skills` etc. for better UX
- [ ] Add worktree support to github-dev create-pr and commit-staged commands

## References

- [Claude Code](https://github.com/anthropics/claude-code) - Official CLI for Claude
- [Claude Code Plugins](https://code.claude.com/docs/en/plugins-reference) - Plugin format reference
- [Anthropic Skills](https://github.com/anthropics/skills) - Official skill examples
- [OpenAI Codex](https://github.com/openai/codex) - Official CLI for Codex
- [Codex Plugins](https://developers.openai.com/codex/plugins/build/) - Plugin format reference
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Official CLI for Gemini
- [Gemini Extensions](https://geminicli.com/docs/extensions/reference/) - Extension format reference
- [Cursor Plugins](https://cursor.com/docs/reference/plugins) - Plugin format reference
- [AGENTS.md](https://agents.md/) - Cross-tool agent specification
- [Agent Skills](https://agentskills.io/) - Open format for giving agents new capabilities

## Thank you for the support!

[![Star History Chart](https://api.star-history.com/svg?repos=fcakyon/claude-codex-settings&type=Date)](https://www.star-history.com/#fcakyon/claude-codex-settings&Date)
