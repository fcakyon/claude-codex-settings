# Installation Guide

Complete installation guide for Claude Code, dependencies, and this configuration.

> **Prefer easier setup?** Use the [plugin marketplace](README.md#installation) to install agents/commands/hooks/MCP. You'll still need to complete prerequisites and create the AGENTS.md symlink.

## Prerequisites

### Node.js and nvm

Install nvm and Node.js (v22+ recommended):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 22
node -v     # Should print "v22.17.1".
nvm current # Should print "v22.17.1".
```

### Claude Code and OpenAI Codex

Install Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

Install OpenAI Codex:

```bash
npm install -g @openai/codex
```

Optionally install IDE extensions:

- [Claude Code VSCode extension](https://docs.claude.com/en/docs/claude-code/vs-code) for 100% IDE integration
- [Codex VSCode extension](https://developers.openai.com/codex/ide) for 100% IDE integration

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
