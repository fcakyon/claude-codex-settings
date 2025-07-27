# claude-settings

My personal Claude [Code](https://github.com/anthropics/claude-code)/[Desktop](https://claude.ai/download) setup with battle-tested commands and MCP servers that I use daily.

## Setup

- Install nvm and Node.js (v22+ recommended)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 22
node -v # Should print "v22.17.1".
nvm current # Should print "v22.17.1".
```

- Install Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

- Install jq (required for hooks):

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

- Convert to local setup instead of global:

```bash
claude migrate-installer
```

## MCP Servers

The MCP (Model Context Protocol) configuration lives in [`mcp.json`](./mcp.json). These are some solid MCP server repos worth checking out:

- [Azure MCP](https://github.com/Azure/azure-mcp) - 40+ Azure tools (100% free)
- [Context7](https://github.com/upstash/context7) - Up-to-date documentation context for 20K+ libraries (100% free)
- [GitHub MCP Server](https://github.com/github/github-mcp-server) - 50+ GitHub tools (100% free)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) - 30+ browser/web testing tools (100% free)
- [Slack MCP Server](https://github.com/ubie-oss/slack-mcp-server) - 10+ Slack tools (100% free)
- [Tavily MCP](https://github.com/tavily-ai/tavily-mcp) - 4 tools for web search and scraping. Better than Claude Code's built-in WebFetch tool (free tier: 1000 monthly requests)

## Configuration

The Claude Code configuration is stored in [`.claude/settings.json`](./.claude/settings.json) and includes:
- Model selection (currently using Sonnet 4)
- Environment variables for optimal Claude Code behavior
- Settings for disabling telemetry and non-essential features
- Custom hooks for enhancing tool functionality

## Hooks

Custom hooks that enhance tool usage, configured in [`.claude/settings.json`](./.claude/settings.json):

### Setup

Make hook scripts executable after cloning:
```bash
chmod +x ./.claude/hooks/*.py
```

### Web Content Enhancement Hooks

- **[hook_webfetch_to_tavily_extract.py](./.claude/hooks/hook_webfetch_to_tavily_extract.py)**: Blocks WebFetch and suggests using Tavily extract with advanced depth
- **[hook_tavily_extract_to_advanced.py](./.claude/hooks/hook_tavily_extract_to_advanced.py)**: Enhances tavily-extract calls with advanced extraction depth for better content parsing
- **[hook_websearch_to_tavily_search.py](./.claude/hooks/hook_websearch_to_tavily_search.py)**: Blocks WebSearch and suggests using Tavily search instead

### Code Quality Hooks

- **Whitespace Cleanup** ([settings.json#L64-L74](./.claude/settings.json#L64-L74)): Automatically removes whitespace from empty lines in Python, JavaScript, and TypeScript files (`.py`, `.js`, `.jsx`, `.ts`, `.tsx`) after any Edit, MultiEdit, or Write operation. Works cross-platform (macOS and Linux).

These hooks provide better handling of complex web elements, improved content extraction quality, and automatic code formatting.

For more details, see the [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks).

## Commands

Custom Claude Code commands that make life easier, stored in [`.claude/commands/`](./.claude/commands/):

- [`apply-thinking-to.md`](./.claude/commands/apply-thinking-to.md) - Prompt enhancement using advanced thinking patterns (inspired by [centminmod's version](https://github.com/centminmod/my-claude-code-setup/blob/master/.claude/commands/anthropic/apply-thinking-to.md))
- [`cleanup-context.md`](./.claude/commands/cleanup-context.md) - Clean up and optimize Claude's context memory
- [`commit-staged-changes.md`](./.claude/commands/commit-staged-changes.md) - Automated commit creation with conventional commit messages
- [`explain-architecture-pattern.md`](./.claude/commands/explain-architecture-pattern.md) - Identify and explain architectural patterns and design decisions
- [`update-memory.md`](./.claude/commands/update-memory.md) - Update Claude's memory bank with new information
- [`update-pr-summary.md`](./.claude/commands/update-pr-summary.md) - Generate PR summaries with advanced analytical frameworks

## Extra Resources

- [Claude MCP Server Setup](https://docs.anthropic.com/en/docs/claude-code/mcp#project-scope)

- [Claude Code Commands Setup](https://docs.anthropic.com/en/docs/claude-code/slash-commands#command-types)