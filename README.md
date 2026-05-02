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

> _"They make wrong assumptions on your behalf and just run along with them without checking. They don't manage their confusion, they don't seek clarifications, they don't surface inconsistencies, they don't present tradeoffs. They really like to overcomplicate code and APIs, they bloat abstractions, they don't clean up dead code after themselves."_ -- [Andrej Karpathy](https://x.com/karpathy/status/2015883857489522876)

This repo's guidelines are structured to fix exactly these pitfalls.

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

</details>

<details>
<summary><strong>Codex CLI</strong></summary>

Codex installs plugins from a local marketplace rather than a direct shell install command.

1. Clone this repo locally and open it in Codex.
2. This repo already includes `.agents/plugins/marketplace.json`.
3. If Codex was already open when you added or changed that file, restart Codex.
4. In Codex, open `/plugins`.
5. Choose `Claude & Codex Settings` and install the plugins you want.

> This README only covers installing this marketplace.
> For generic Codex marketplace examples and maintainer docs, see [CLAUDE.md](CLAUDE.md).

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
<summary><strong>intelligent-compact</strong> - Stop Claude Code from forgetting file paths, root causes, and open questions when it auto-summarizes long sessions</summary>

| Claude Code                                           | Codex CLI                                                                     | Gemini CLI                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `/plugin install intelligent-compact@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `intelligent-compact` | `gemini extensions install --path ./plugins/intelligent-compact` |

When Claude Code auto-summarizes a long session, the default summary routinely drops the highest-signal facts. This plugin tells the summarizer to keep them:

- **File paths under investigation** so the next turn doesn't re-discover where you were
- **Confirmed root causes** so you don't re-debug what's already solved
- **Open questions, metrics, and IDs** that prose summaries usually round away
- **Findings from expensive subagent runs** that took minutes to gather

Runs on every `/compact` (manual) and every auto compaction. Claude Code only; Codex, Cursor, and Gemini CLI don't yet expose a comparable summary hook.

**Hooks:**

- [`precompact_priorities.sh`](./plugins/intelligent-compact/hooks/scripts/precompact_priorities.sh) - Priority-preservation instructions for the compaction summarizer

</details>

<details>
<summary><strong>claude-telemetry-hooks</strong> - Track per-device Claude Code usage, rejection reasons, and per-session stats from a single dashboard</summary>

| Claude Code                                              | Codex CLI | Gemini CLI                                                          |
| -------------------------------------------------------- | --------- | ------------------------------------------------------------------- |
| `/plugin install claude-telemetry-hooks@claude-settings` | n/a       | `gemini extensions install --path ./plugins/claude-telemetry-hooks` |

Adds the two missing pieces Claude Code's telemetry needs to power a usage dashboard:

- **Sticky session ID per project**: resumed conversations stay one session, not dozens
- **Categorized rejection reasons** (profanity, wrong target, scope drift, retry, and more): chart why Claude pushes back

Per-device data is already in Claude Code's built-in OpenTelemetry stream. Pairs naturally with `openobserve-skills` for the dashboard side.

**Hooks:**

- [`session_start_chat_id.py`](./plugins/claude-telemetry-hooks/hooks/scripts/session_start_chat_id.py) - SessionStart hook that emits a sticky per-project `chat_id`
- [`user_prompt_reject_feedback.py`](./plugins/claude-telemetry-hooks/hooks/scripts/user_prompt_reject_feedback.py) - UserPromptSubmit hook that categorizes tool-rejection reasons

</details>

<details>
<summary><strong>anthropic-office-skills</strong> - Official Anthropic PDF, Word, PowerPoint, Excel skills</summary>

| Claude Code                                               | Codex CLI                                                                         | Gemini CLI                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `/plugin install anthropic-office-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `anthropic-office-skills` | `gemini extensions install --path ./plugins/anthropic-office-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/anthropic-office-skills --skill '*'
```

Official office document skills from [anthropics/skills](https://github.com/anthropics/skills).

| Skill                                                            | Description                                             | Install                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`pdf`](./plugins/anthropic-office-skills/skills/pdf/SKILL.md)   | PDF processing (read, merge, split, create, OCR, forms) | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/pdf.zip)  |
| [`pptx`](./plugins/anthropic-office-skills/skills/pptx/SKILL.md) | PowerPoint presentation building and editing            | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/pptx.zip) |
| [`xlsx`](./plugins/anthropic-office-skills/skills/xlsx/SKILL.md) | Excel spreadsheet processing with formulas              | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/xlsx.zip) |
| [`docx`](./plugins/anthropic-office-skills/skills/docx/SKILL.md) | Word document creation and editing                      | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/docx.zip) |

</details>

<details>
<summary><strong>openai-office-skills</strong> - Official OpenAI PDF, Word, PowerPoint, Excel skills</summary>

| Claude Code                                            | Codex CLI                                                                      | Gemini CLI                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `/plugin install openai-office-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `openai-office-skills` | `gemini extensions install --path ./plugins/openai-office-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/openai-office-skills --skill '*'
```

Official office document skills from [openai/skills](https://github.com/openai/skills).

| Skill                                                                       | Description                                         | Install                                                                                                                                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`pdf`](./plugins/openai-office-skills/skills/pdf/SKILL.md)                 | PDF generation and extraction with visual review    | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/pdf.zip)         |
| [`slides`](./plugins/openai-office-skills/skills/slides/SKILL.md)           | Slide deck creation with PptxGenJS                  | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/slides.zip)      |
| [`spreadsheet`](./plugins/openai-office-skills/skills/spreadsheet/SKILL.md) | Spreadsheet processing with formulas and formatting | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/spreadsheet.zip) |
| [`doc`](./plugins/openai-office-skills/skills/doc/SKILL.md)                 | Word document creation and editing                  | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/doc.zip)         |

</details>

<details>
<summary><strong>python-skills</strong> - Python best practices from PEP 8, Zen of Python, Google Style Guide, Effective Python</summary>

| Claude Code                                     | Codex CLI                                                               | Gemini CLI                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| `/plugin install python-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `python-skills` | `gemini extensions install --path ./plugins/python-skills` |

Python coding guidelines grounded in authoritative sources: PEP 8, PEP 20 (Zen of Python), Google Python Style Guide, and Brett Slatkin's "Effective Python" (3rd ed.). Covers code integration, idiomatic patterns, YAGNI anti-abstraction rules, Google-style docstrings, and 18 before/after code examples.

**Skills:**

| Skill                                                                            | Description                                 |
| -------------------------------------------------------------------------------- | ------------------------------------------- |
| [`python-guidelines`](./plugins/python-skills/skills/python-guidelines/SKILL.md) | Core rules, self-tests, and reference index |

**Reference files:**

- [`zen-of-python.md`](./plugins/python-skills/skills/python-guidelines/references/zen-of-python.md) - Full PEP 20 with annotations
- [`google-style-guide.md`](./plugins/python-skills/skills/python-guidelines/references/google-style-guide.md) - Curated sections with source URLs
- [`idiomatic-patterns.md`](./plugins/python-skills/skills/python-guidelines/references/idiomatic-patterns.md) - 18 patterns with before/after code
- [`effective-python-tips.md`](./plugins/python-skills/skills/python-guidelines/references/effective-python-tips.md) - Key tips from 3rd edition

</details>

<details>
<summary><strong>react-skills</strong> - Official React, Next.js, and React Native best practices</summary>

| Claude Code                                    | Codex CLI                                                              | Gemini CLI                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `/plugin install react-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `react-skills` | `gemini extensions install --path ./plugins/react-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/react-skills --skill '*'
```

React and frontend best practices from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills).

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

| Claude Code                                     | Codex CLI                                                               | Gemini CLI                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| `/plugin install agent-browser@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `agent-browser` | `gemini extensions install --path ./plugins/agent-browser` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/agent-browser --skill '*'
```

Browser automation via CLI instead of MCP. [93% less context usage](https://medium.com/@richardhightower/agent-browser-ai-first-browser-automation-that-saves-93-of-your-context-window-7a2c52562f8c) than Playwright MCP by using snapshot + element refs instead of full DOM tree dumps. From [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                    | Description                                                                  | ZIP                                                                                                                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`agent-browser`](./plugins/agent-browser/skills/agent-browser/SKILL.md) | Browser automation: navigation, forms, clicking, screenshots, auth, sessions | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/agent-browser.zip) |
| [`electron`](./plugins/agent-browser/skills/electron/SKILL.md)           | Automate Electron desktop apps (VS Code, Slack, Discord, Figma, Notion)      | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/electron.zip)      |

**CLI Tool:** [agent-browser](https://github.com/vercel-labs/agent-browser) - install via `npm i -g agent-browser && agent-browser install`

</details>

<details>
<summary><strong>frontend-design-skills</strong> - Official frontend design skills (Anthropic + OpenAI)</summary>

| Claude Code                                              | Codex CLI                                                                        | Gemini CLI                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `/plugin install frontend-design-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `frontend-design-skills` | `gemini extensions install --path ./plugins/frontend-design-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/frontend-design-skills --skill '*'
```

Frontend design skills from [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) and [openai/skills](https://github.com/openai/skills).

| Skill                                                                                                     | Description                                                                       | Install                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`openai-frontend-design`](./plugins/frontend-design-skills/skills/openai-frontend-design/SKILL.md)       | Composition-first design: restrained layout, image-led hierarchy, tasteful motion | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/openai-frontend-design.zip)    |
| [`anthropic-frontend-design`](./plugins/frontend-design-skills/skills/anthropic-frontend-design/SKILL.md) | Bold aesthetic direction, distinctive typography, anti-generic AI aesthetics      | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/anthropic-frontend-design.zip) |

</details>

<details>
<summary><strong>mongodb-skills</strong> - Official MongoDB agent skills for schema design, query tuning, and Atlas Search</summary>

| Claude Code                                      | Codex CLI                                                                | Gemini CLI                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `/plugin install mongodb-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `mongodb-skills` | `gemini extensions install --path ./plugins/mongodb-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/mongodb-skills --skill '*'
```

Official MongoDB agent skills for schema design, query tuning, Atlas Search, and connections. From [mongodb/agent-skills](https://github.com/mongodb/agent-skills).

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
<summary><strong>supabase-skills</strong> - Supabase Postgres best practices, JavaScript SDK, and CLI skills</summary>

| Claude Code                                       | Codex CLI                                                                 | Gemini CLI                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `/plugin install supabase-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `supabase-skills` | `gemini extensions install --path ./plugins/supabase-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/supabase-skills --skill '*'
```

Supabase skills covering Postgres query/schema best practices from [supabase/agent-skills](https://github.com/supabase/agent-skills), JavaScript SDK usage from [supabase/supabase-js](https://github.com/supabase/supabase-js), and CLI workflows from [supabase/cli](https://github.com/supabase/cli).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                                                            | Description                                                          | ZIP                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`supabase-postgres-best-practices`](./plugins/supabase-skills/skills/supabase-postgres-best-practices/SKILL.md) | Postgres performance and schema design across 8 categories           | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/supabase-postgres-best-practices.zip) |
| [`supabase-js`](./plugins/supabase-skills/skills/supabase-js/SKILL.md)                                           | JavaScript SDK for auth, database, storage, realtime, edge functions | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/supabase-js.zip)                      |
| [`supabase-cli`](./plugins/supabase-skills/skills/supabase-cli/SKILL.md)                                         | CLI for local dev, migrations, edge functions, project management    | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/supabase-cli.zip)                     |

</details>

<details>
<summary><strong>stripe-skills</strong> - Official Stripe agent skills for payments, billing, Connect, and API upgrades</summary>

| Claude Code                                     | Codex CLI                                                               | Gemini CLI                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| `/plugin install stripe-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `stripe-skills` | `gemini extensions install --path ./plugins/stripe-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/stripe-skills --skill '*'
```

Official Stripe agent skills for payment integration: API selection, Connect platform setup, billing/subscriptions, Treasury, and SDK upgrades. From [stripe/ai](https://github.com/stripe/ai).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                                    | Description                                                     | ZIP                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`stripe-best-practices`](./plugins/stripe-skills/skills/stripe-best-practices/SKILL.md) | Payments, billing, Connect, Treasury integration best practices | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/stripe-best-practices.zip) |
| [`stripe-projects`](./plugins/stripe-skills/skills/stripe-projects/SKILL.md)             | Stripe Projects CLI setup and stack provisioning                | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/stripe-projects.zip)       |
| [`upgrade-stripe`](./plugins/stripe-skills/skills/upgrade-stripe/SKILL.md)               | Stripe API version and SDK upgrade guide                        | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/upgrade-stripe.zip)        |

</details>

<details>
<summary><strong>polar-skills</strong> - Official Polar agent skills for billing, subscriptions, and local dev environment</summary>

| Claude Code                                    | Codex CLI                                                              | Gemini CLI                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `/plugin install polar-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `polar-skills` | `gemini extensions install --path ./plugins/polar-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/polar-skills --skill '*'
```

Official Polar agent skills for billing system, Stripe integration, subscription lifecycle, and local dev with Docker. From [polarsource/polar](https://github.com/polarsource/polar).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                                       | Description                                                                   | ZIP                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`polar-billing`](./plugins/polar-skills/skills/polar-billing/SKILL.md)                     | Polar billing system, Stripe integration, subscriptions, benefit provisioning | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/polar-billing.zip)           |
| [`polar-local-environment`](./plugins/polar-skills/skills/polar-local-environment/SKILL.md) | Polar local development environment with Docker                               | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/polar-local-environment.zip) |

</details>

<details>
<summary><strong>livekit-skills</strong> - LiveKit voice AI agent development (Cloud + self-hosted)</summary>

| Claude Code                                      | Codex CLI                                                                | Gemini CLI                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `/plugin install livekit-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `livekit-skills` | `gemini extensions install --path ./plugins/livekit-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/livekit-skills --skill '*'
```

Voice AI agent development with the LiveKit Agents SDK. Cloud-agnostic: supports both LiveKit Cloud and self-hosted deployments. Uses `lk` CLI for docs access instead of MCP. Based on [livekit/agent-skills](https://github.com/livekit/agent-skills), patched for CLI workflow and BYOK model providers.

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                       | Description                                                    | ZIP                                                                                                                                                                    |
| --------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`livekit-skills`](./plugins/livekit-skills/skills/livekit-skills/SKILL.md) | Voice AI agents: architecture, handoffs, testing, CLI workflow | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/livekit-skills.zip) |

</details>

<details>
<summary><strong>cloudflare-skills</strong> - Official Cloudflare developer platform skill for Workers, R2, D1, KV, AI, and 50+ services</summary>

| Claude Code                                         | Codex CLI                                                                   | Gemini CLI                                                     |
| --------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `/plugin install cloudflare-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `cloudflare-skills` | `gemini extensions install --path ./plugins/cloudflare-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/cloudflare-skills --skill '*'
```

Cloudflare developer platform skill with decision trees for product selection across Workers, Durable Objects, R2, D1, KV, Workers AI, and 50+ services. From [cloudflare/skills](https://github.com/cloudflare/skills).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                                | Description                                                     | ZIP                                                                                                                                                                       |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`cloudflare-deploy`](./plugins/cloudflare-skills/skills/cloudflare-deploy/SKILL.md) | Cloudflare platform: compute, storage, AI, networking, security | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/cloudflare-deploy.zip) |

</details>

<details>
<summary><strong>web-performance-skills</strong> - Web performance auditing with Core Web Vitals, Lighthouse, and Chrome DevTools</summary>

| Claude Code                                              | Codex CLI                                                                        | Gemini CLI                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `/plugin install web-performance-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `web-performance-skills` | `gemini extensions install --path ./plugins/web-performance-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/web-performance-skills --skill '*'
```

Audit web page performance using Chrome DevTools MCP. Measures Core Web Vitals (FCP, LCP, TBT, CLS, Speed Index), identifies render-blocking resources, network dependency chains, layout shifts, caching issues, and accessibility gaps. From [cloudflare/skills](https://github.com/cloudflare/skills).

Bundles the `chrome-devtools` MCP server (no API key needed).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                                                           | Description                                                        | ZIP                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`web-performance-optimization`](./plugins/web-performance-skills/skills/web-performance-optimization/SKILL.md) | Core Web Vitals, Lighthouse, render-blocking, accessibility audits | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/web-performance-optimization.zip) |

</details>

<details>
<summary><strong>openobserve-skills</strong> - OpenObserve REST API skill for AI agents to search logs/metrics/traces and create dashboards via curl</summary>

| Claude Code                                          | Codex CLI                                                                    | Gemini CLI                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `/plugin install openobserve-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `openobserve-skills` | `gemini extensions install --path ./plugins/openobserve-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/openobserve-skills --skill '*'
```

Programmatic access to OpenObserve (Cloud or self-hosted) via the documented REST API. Covers:

- **Auth and search**: HTTP Basic auth, the search/SQL endpoint with microsecond timestamps
- **Streams and dashboards**: stream listing/schema, dashboard CRUD, the v8 panel JSON schema
- **Known pitfalls**: the `customQuery` re-aggregation bug that doubles table rows when `fields.y` carries an `aggregationFunction`

Built for AI agents: uses `curl` only, no SDK or CLI dependency. Pairs naturally with `claude-telemetry-hooks` for Claude Code usage dashboards. Reference docs are mirrored from [openobserve/openobserve-docs](https://github.com/openobserve/openobserve-docs).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                             | Description                                                                         | ZIP                                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`openobserve-api`](./plugins/openobserve-skills/skills/openobserve-api/SKILL.md) | Search SQL, streams, dashboards, panel schema, ingestion endpoints, common pitfalls | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/openobserve-api.zip) |

</details>

<details>
<summary><strong>hetzner-skills</strong> - Hetzner Cloud CLI skill for servers, networks, firewalls, load balancers, DNS, and storage</summary>

| Claude Code                                      | Codex CLI                                                                | Gemini CLI                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `/plugin install hetzner-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `hetzner-skills` | `gemini extensions install --path ./plugins/hetzner-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/hetzner-skills --skill '*'
```

Hetzner Cloud infrastructure management via the `hcloud` CLI. Decision trees for compute, networking, storage, DNS, and common deploy workflows. Reference docs extracted from [hetznercloud/cli](https://github.com/hetznercloud/cli).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                       | Description                                                         | ZIP                                                                                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`hetzner-deploy`](./plugins/hetzner-skills/skills/hetzner-deploy/SKILL.md) | Servers, networks, firewalls, load balancers, DNS, volumes, storage | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/hetzner-deploy.zip) |

</details>

<details>
<summary><strong>dokploy-skills</strong> - Dokploy deployment skill for Dokploy Cloud and self-hosted dashboards</summary>

| Claude Code                                      | Codex CLI                                                                | Gemini CLI                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `/plugin install dokploy-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `dokploy-skills` | `gemini extensions install --path ./plugins/dokploy-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/dokploy-skills --skill '*'
```

Dokploy Cloud and self-hosted dashboard workflows from [Dokploy/website](https://github.com/Dokploy/website), plus a compact CLI command index generated from [Dokploy/cli](https://github.com/Dokploy/cli).

**Skills** (ZIP for claude.ai, Claude Code, Cursor, Codex, VS Code):

| Skill                                                                       | Description                                                                                         | ZIP                                                                                                                                                                    |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`dokploy-deploy`](./plugins/dokploy-skills/skills/dokploy-deploy/SKILL.md) | Dokploy Cloud, self-hosted dashboard, Docker Compose, databases, domains, remote servers, CLI index | [![ZIP](https://img.shields.io/badge/⬇%20ZIP-2ea44f?style=flat-square)](https://github.com/fcakyon/claude-codex-settings/releases/latest/download/dokploy-deploy.zip) |

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
<summary><strong>github-dev</strong> - Git workflow agents + skills</summary>

| Claude Code                                  | Codex CLI                                                            | Gemini CLI                                              |
| -------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| `/plugin install github-dev@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `github-dev` | `gemini extensions install --path ./plugins/github-dev` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/github-dev --skill '*'
```

Git and GitHub automation. Run the `setup` skill after install.

**Agents:**

- [`commit-creator`](./plugins/github-dev/agents/commit-creator.md) - Intelligent commit workflow
- [`pr-creator`](./plugins/github-dev/agents/pr-creator.md) - Pull request creation
- [`pr-reviewer`](./plugins/github-dev/agents/pr-reviewer.md) - Code review agent
- [`pr-comment-resolver`](./plugins/github-dev/agents/pr-comment-resolver.md) - PR comment resolution

**Skills:**

- [`commit-staged`](./plugins/github-dev/skills/commit-staged/SKILL.md) - Commit staged changes and write the message
- [`create-pr`](./plugins/github-dev/skills/create-pr/SKILL.md) - Create a pull request from the full branch diff
- [`review-pr`](./plugins/github-dev/skills/review-pr/SKILL.md) - Review a pull request for bugs and regressions
- [`resolve-pr-comments`](./plugins/github-dev/skills/resolve-pr-comments/SKILL.md) - Address unresolved PR review comments
- [`update-pr-summary`](./plugins/github-dev/skills/update-pr-summary/SKILL.md) - Update the PR title and description
- [`clean-gone-branches`](./plugins/github-dev/skills/clean-gone-branches/SKILL.md) - Clean local branches deleted from remote
- [`setup`](./plugins/github-dev/skills/setup/SKILL.md) - Configure GitHub CLI

**Hooks:**

- [`git_commit_confirm.py`](./plugins/github-dev/hooks/scripts/git_commit_confirm.py) - Confirmation before git commit
- [`gh_pr_create_confirm.py`](./plugins/github-dev/hooks/scripts/gh_pr_create_confirm.py) - Confirmation before gh pr create

</details>

<details>
<summary><strong>ultralytics-dev</strong> - Auto-formatting hooks</summary>

| Claude Code                                       | Codex CLI                                                                 | Gemini CLI                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `/plugin install ultralytics-dev@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `ultralytics-dev` | `gemini extensions install --path ./plugins/ultralytics-dev` |

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

| Claude Code                                   | Codex CLI                                                             | Gemini CLI                                               |
| --------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| `/plugin install azure-tools@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `azure-tools` | `gemini extensions install --path ./plugins/azure-tools` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/azure-tools --skill '*'
```

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

| Claude Code                                    | Codex CLI                                                              | Gemini CLI                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `/plugin install claude-tools@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `claude-tools` | `gemini extensions install --path ./plugins/claude-tools` |

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

| Claude Code                                    | Codex CLI                                                              | Gemini CLI                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `/plugin install gcloud-tools@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `gcloud-tools` | `gemini extensions install --path ./plugins/gcloud-tools` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/gcloud-tools --skill '*'
```

Logs, metrics, and traces. Run `/gcloud-tools:setup` after install.

**Skills:**

- [`gcloud-usage`](./plugins/gcloud-tools/skills/gcloud-usage/SKILL.md) - Best practices for GCloud Logs/Metrics/Traces
- [`setup`](./plugins/gcloud-tools/skills/setup/SKILL.md) - Troubleshooting guide

**Commands:**

- [`/gcloud-tools:setup`](./plugins/gcloud-tools/commands/setup.md) - Configure GCloud MCP

**MCP:** [`.mcp.json`](./plugins/gcloud-tools/.mcp.json) | [google-cloud/observability-mcp](https://github.com/googleapis/gcloud-mcp)

</details>

<details>
<summary><strong>paper-search-tools</strong> - Paper Search MCP & Skills</summary>

| Claude Code                                          | Codex CLI                                                                    | Gemini CLI                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `/plugin install paper-search-tools@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `paper-search-tools` | `gemini extensions install --path ./plugins/paper-search-tools` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/paper-search-tools --skill '*'
```

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

| Claude Code                                    | Codex CLI                                                              | Gemini CLI                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `/plugin install tavily-tools@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `tavily-tools` | `gemini extensions install --path ./plugins/tavily-tools` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/tavily-tools --skill '*'
```

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

<details>
<summary><strong>overleaf-skills</strong> - Pull Overleaf review comments into your local .tex repo and apply the suggested edits</summary>

| Claude Code                                       | Codex CLI                                                                 | Gemini CLI                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `/plugin install overleaf-skills@claude-settings` | Open `/plugins` -> `Claude & Codex Settings` -> install `overleaf-skills` | `gemini extensions install --path ./plugins/overleaf-skills` |

**Skills CLI**

```bash
npx skills add https://github.com/fcakyon/claude-codex-settings/tree/main/plugins/overleaf-skills --skill '*'
```

Pull reviewer comments from an Overleaf project, locate each in your local git-tracked `*.tex` files, and apply edits you review. Run setup once to paste your Overleaf session cookie; sessions slide ~5 days idle. Pairs naturally with `github-dev` for the commit step.

**Skills:**

- [`setup`](./plugins/overleaf-skills/skills/setup/SKILL.md) - Capture and refresh the Overleaf session cookie
- [`review-overleaf`](./plugins/overleaf-skills/skills/review-overleaf/SKILL.md) - Fetch unresolved review threads and apply edits to local .tex files

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
<summary><strong>MiniMax M2.7 (204K context)</strong></summary>

Run Claude Code with [MiniMax M2.7](https://www.minimax.io) via Anthropic-compatible API - [source](https://api.minimax.io/anthropic):

- **Model**: `MiniMax-M2.7` - 204K context window
- **Fast model**: `MiniMax-M2.7-highspeed` - high-throughput variant
- **API key**: Get from [minimax.io](https://www.minimax.io)

```bash
export ANTHROPIC_BASE_URL=https://api.minimax.io/anthropic
export ANTHROPIC_AUTH_TOKEN="your-minimax-api-key"
export ANTHROPIC_MODEL=MiniMax-M2.7
export ANTHROPIC_DEFAULT_OPUS_MODEL=MiniMax-M2.7
export ANTHROPIC_DEFAULT_SONNET_MODEL=MiniMax-M2.7
export ANTHROPIC_DEFAULT_HAIKU_MODEL=MiniMax-M2.7-highspeed
export CLAUDE_CODE_SUBAGENT_MODEL=MiniMax-M2.7
export ENABLE_TOOL_SEARCH=false
```

Or use the settings file: [`.claude/settings-minimax.json`](./.claude/settings-minimax.json)

For Codex CLI, see the recipe at [`.codex/config-minimax.toml`](./.codex/config-minimax.toml). Note that Codex requires a local Responses API proxy since MiniMax only exposes chat completions.

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

- [ ] Replace MCP-based plugins with CLI alternatives where possible (mongodb, tavily, gcloud, azure, paper-search)

**New plugins/skills:**

- [x] Payments: [Stripe](https://stripe.com) best practices, [Polar](https://polar.sh) billing and local dev
- [ ] Payments: [Paddle](https://www.paddle.com) billing and checkout skills
- [x] Deployment: [Cloudflare](https://www.cloudflare.com) platform skill
- [x] Deployment: [Hetzner Cloud](https://www.hetzner.com/cloud) CLI skill
- [x] Deployment: [Dokploy](https://github.com/Dokploy/dokploy) deployment skill
- [x] Frontend design: Anthropic + OpenAI frontend design skills (bundled as `frontend-design-skills`)
- [ ] Frontend: [TanStack](https://tanstack.com) (Router, Query, Table, Form)
- [x] Real-time: [LiveKit](https://livekit.io) voice/video agent skill
- [x] Documents: Google Docs, PPTX, DOCX, Excel from OpenAI (bundled as `openai-office-skills`)
- [ ] Auth: Clerk, Firebase patterns
- [ ] Fullstack: FastAPI, NodeJS backends, Tailwind CSS v4, [shadcn/ui](https://github.com/shadcn-ui/ui), Sentry monitoring, [Web Vitals](https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals)
- [ ] Productivity: [Caveman](https://github.com/JuliusBrussee/caveman) compressed output style saving ~75% of tokens

**Static website:**

- [ ] Publish `agentplugins.net` as a plugin catalog site with search, category filtering, per-tool install snippets, and GitHub Pages hosting

**Other:**

- [ ] Change marketplace and repo name to Agent Plugins instead of Claude Settings or Claude Codex Settings, and update the repo thumbnail

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
