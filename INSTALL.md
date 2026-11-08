# Installation Guide

Installation guide for Claude Code, OpenAI Codex, Cursor, Antigravity CLI, dependencies, and this configuration.

> Use the [plugin marketplace](README.md#installation) to install agents/commands/hooks/MCP. You'll still need to complete prerequisites and set up the shared guidance file.

## Prerequisites

### Claude Code

Install Claude Code using the native installer (no Node.js required):

**macOS/Linux/WSL:**

```bash
# Install via native installer
curl -fsSL https://claude.ai/install.sh | bash

# Or via Homebrew
brew install --cask claude-code

# Verify installation
claude --version
```

**Windows PowerShell:**

```powershell
# Install via native installer
irm https://claude.ai/install.ps1 | iex

# Verify installation
claude --version
```

**Migrate from legacy npm installation:**

```bash
claude install
```

Optionally install IDE extension:

- [Claude Code VSCode extension](https://docs.claude.com/en/docs/claude-code/vs-code) for IDE integration

### OpenAI Codex

Install OpenAI Codex:

```bash
npm install -g @openai/codex
```

Optionally install IDE extension:

- [Codex VSCode extension](https://developers.openai.com/codex/ide) for IDE integration

### Claude Code Plugins

```bash
# Add marketplace (one time)
claude plugin marketplace add fcakyon/claude-codex-settings

# Install any plugin by name
claude plugin install simplify@claude-settings
```

In Claude Code desktop, select **+** beside the prompt, then **Plugins** and **Add plugin**.

### Codex Plugins

```bash
# Add marketplace (one time)
codex plugin marketplace add fcakyon/claude-codex-settings

# Install any plugin by name
codex plugin add simplify@claude-settings
```

In the Codex desktop app, open **Plugins**, find the plugin, and select **Install**.

### Cursor Plugins

```bash
# Add marketplace (one time)
cursor-agent plugin marketplace add https://github.com/fcakyon/claude-codex-settings

# Start the interactive CLI
cursor-agent
```

Enter `/plugin`, open the marketplace, and install the plugin at user or project scope. In the Cursor app, open **Customize** and select **Install**.

### Antigravity CLI

Install Antigravity CLI:

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
agy --version
```

Install [uv](https://docs.astral.sh/uv/getting-started/installation/), then use the repository installer:

```bash
git clone https://github.com/fcakyon/claude-codex-settings.git
cd claude-codex-settings
uv run .github/scripts/antigravity.py install simplify
```

The installer builds native Antigravity bundles from the shared skills and MCP servers, then calls `agy plugin install`. It keeps full instructions when a skill exceeds Antigravity's 24 KB loading limit. Claude-only hooks, agents, commands, and output styles are not part of these bundles. Plugins without skills or MCP servers are unavailable in Antigravity. Start a new session and use `/simplify`, `/seo-audit`, or another installed skill.

Codex and Cursor also accept the portable [Agent Plugins format](https://agent-plugins.org/). Their marketplace files and existing hook and agent settings differ, so this repo shares source content and generates tool-specific metadata instead of treating the APIs as identical.

### Required Tools

#### jq (JSON processor - required for hooks)

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# No sudo: local binary
mkdir -p ~/.local/bin
curl -Lo ~/.local/bin/jq https://github.com/jqlang/jq/releases/latest/download/jq-linux-amd64
chmod +x ~/.local/bin/jq
```

#### GitHub CLI (required for github-dev plugin)

```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt-get install gh

# No sudo: local binary
mkdir -p ~/.local/bin
GH_VERSION=$(curl -s https://api.github.com/repos/cli/cli/releases/latest | grep tag_name | cut -d '"' -f 4 | sed 's/v//')
curl -Lo gh.tar.gz "https://github.com/cli/cli/releases/latest/download/gh_${GH_VERSION}_linux_amd64.tar.gz"
tar xzf gh.tar.gz --strip-components=1 -C ~/.local/bin "gh_${GH_VERSION}_linux_amd64/bin/gh"
rm gh.tar.gz
```

> If using local binaries, add `~/.local/bin` to PATH: `export PATH="$HOME/.local/bin:$PATH"`

### Code Quality Tools

The ultralytics-dev format hook runs the Ultralytics Actions formatters. uv fetches ultralytics-actions and its ruff and npx fetches Prettier and Biome on first use, so the first formatted file needs network access. Shell scripts need shfmt.

```bash
# macOS
brew install uv node shfmt

# Linux: install Node.js with your package manager, then uv and a local shfmt binary
curl -LsSf https://astral.sh/uv/install.sh | sh
mkdir -p ~/.local/bin
curl -Lo ~/.local/bin/shfmt https://github.com/mvdan/sh/releases/download/v3.13.1/shfmt_v3.13.1_linux_amd64
chmod +x ~/.local/bin/shfmt
```

> Verify all three are on PATH: `uvx --version && npx --version && shfmt --version`. The hook skips a formatter whose tool is missing, so nothing gets formatted and nothing warns you.

## Post-Installation Setup

### Create Shared Agent Guidance

Start from [`.claude/CLAUDE.md`](https://github.com/fcakyon/claude-codex-settings/blob/main/.claude/CLAUDE.md), the guidance file this repo ships for your projects. `/claude-tools:sync-claude-md` pulls it into `~/.claude/CLAUDE.md`; in a single project, paste it as `CLAUDE.md` instead. Then symlink it for cross-tool compatibility ([AGENTS.md](https://agents.md/)):

```bash
ln -sfn CLAUDE.md AGENTS.md
```

This lets tools like [OpenAI Codex](https://openai.com/codex/), [Antigravity CLI](https://antigravity.google/docs/getting-started), [Cursor](https://cursor.com), [Github Copilot](https://github.com/features/copilot) and [Qwen Code](https://github.com/QwenLM/qwen-code) reuse the same instructions.
