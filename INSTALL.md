# Installation Guide

Complete installation guide for Claude Code, dependencies, and this configuration.

> **Prefer easier setup?** Use the [plugin marketplace](README.md#installation) to install agents/commands/hooks/MCP. You'll still need to complete prerequisites and create the AGENTS.md symlink.

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

### Required Tools

#### jq (JSON processor - required for hooks)

**macOS:**

```bash
brew install jq
```

**Ubuntu/Debian:**

```bash
sudo apt-get install jq
```

**Other Linux distributions:**

```bash
# Check your package manager, e.g.:
# sudo yum install jq (RHEL/CentOS)
# sudo pacman -S jq (Arch)
```

#### GitHub CLI (required for pr-manager agent)

**macOS:**

```bash
brew install gh
```

**Ubuntu/Debian:**

```bash
sudo apt-get install gh
```

**Other Linux distributions:**

```bash
# Check your package manager, e.g.:
# sudo yum install gh (RHEL/CentOS)
# sudo pacman -S github-cli (Arch)
```

### Code Quality Tools

```bash
# Python formatting (required for Python hook)
pip install ruff docformatter

# Prettier for JS/TS/CSS/JSON/YAML/HTML/Markdown/Shell formatting (required for prettier hooks)
# Note: npm is required for prettier even though Claude Code no longer needs it
npm install -g prettier@3.6.2 prettier-plugin-sh
```

## Post-Installation Setup

### Create Shared Agent Guidance

Create a symlink for cross-tool compatibility ([AGENTS.md](https://agents.md/)):

```bash
ln -s CLAUDE.md AGENTS.md
```

This lets tools like [OpenAI Codex](https://openai.com/codex/), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [Cursor](https://cursor.com), [Github Copilot](https://github.com/features/copilot) and [Qwen Code](https://github.com/QwenLM/qwen-code) reuse the same instructions.

### Make Hooks Executable

After cloning the repository:

```bash
chmod +x ./.claude/hooks/*.py
```
