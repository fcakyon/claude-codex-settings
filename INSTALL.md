# Installation Guide

Complete installation guide for Claude Code, dependencies, and this configuration.

> Use the [plugin marketplace](README.md#installation) to install agents/commands/hooks/MCP. You'll still need to complete prerequisites and create the AGENTS.md symlink.

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

### Codex Plugins

Codex installs plugins from local marketplaces rather than a direct shell install command.

#### Use This Repo in Codex

1. Clone this repo locally.
2. Open the repo in Codex. This repo already includes `.agents/plugins/marketplace.json`.
3. If Codex was already open when you added or changed that marketplace file, restart Codex.
4. In Codex, open `/plugins`.
5. Choose `Claude & Codex Settings` and install the plugins you want.

You do not need to create `~/.agents/plugins/marketplace.json` or copy plugin folders manually for this repo. The Codex marketplace is already part of the repository.

If `Claude & Codex Settings` does not appear in `/plugins`, make sure you opened the repo root that contains `.agents/plugins/marketplace.json`, then restart Codex.

For generic Codex marketplace examples and maintainer docs, see [CLAUDE.md](CLAUDE.md).

### Gemini CLI

Install Gemini CLI:

```bash
npm install -g @anthropic-ai/gemini-cli
```

Install individual plugins:

```bash
gemini extensions install --path ./plugins/<plugin-name>
```

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

```bash
# Python formatting (required for Python hook)
uv tool install ruff

# Prettier for JS/TS/CSS/JSON/YAML/HTML/Markdown/Shell formatting (required for prettier hooks)
npm install -g prettier@3.6.2 prettier-plugin-sh
```

## Post-Installation Setup

### Create Shared Agent Guidance

Create symlinks for cross-tool compatibility ([AGENTS.md](https://agents.md/)):

```bash
ln -sfn CLAUDE.md AGENTS.md
ln -sfn CLAUDE.md GEMINI.md
```

This lets tools like [OpenAI Codex](https://openai.com/codex/), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [Cursor](https://cursor.com), [Github Copilot](https://github.com/features/copilot) and [Qwen Code](https://github.com/QwenLM/qwen-code) reuse the same instructions.
