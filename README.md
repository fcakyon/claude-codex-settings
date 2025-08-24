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

- Install code quality tools:

```bash
# Python formatting (required for Python hook)
pip install ruff docformatter

# Prettier for JS/TS/CSS/JSON/YAML/HTML/Markdown/Shell formatting (required for prettier hooks)
npm install -g prettier@3.6.2 prettier-plugin-sh
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
- [MongoDB MCP](https://github.com/mongodb-js/mongodb-mcp-server) - Tools for interacting with MongoDB (100% free)
- [Paper Search MCP](https://github.com/openags/paper-search-mcp) - Search papers across arXiv, PubMed, bioRxiv, Google Scholar, and more (100% free)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) - 30+ browser/web testing tools (100% free)
- [Slack MCP Server](https://github.com/ubie-oss/slack-mcp-server) - 10+ Slack tools (100% free)
- [Tavily MCP](https://github.com/tavily-ai/tavily-mcp) - 4 tools for web search and scraping. Better than Claude Code's built-in WebFetch tool (free tier: 1000 monthly requests)

## Configuration

The Claude Code configuration is stored in [`.claude/settings.json`](./.claude/settings.json) and includes:

- Model selection (currently using Sonnet 4)
- Environment variables for optimal Claude Code behavior
- Settings for disabling telemetry and non-essential features
- Custom hooks for enhancing tool functionality

## Agents

Specialized agents that run automatically to enhance code quality, stored in [`.claude/agents/`](./.claude/agents/):

- [`code-simplifier.md`](./.claude/agents/code-simplifier.md) - Contextual pattern analyzer that ensures new code follows existing project conventions (imports, naming, function signatures, class patterns). Auto-triggers after TodoWrite to maintain codebase consistency.

- [`commit-orchestrator.md`](./.claude/agents/commit-orchestrator.md) - Git commit expert that analyzes staged changes, creates optimal commit strategies, and executes commits with meaningful messages. Handles documentation updates and multi-commit scenarios.

For more details, see the [Claude Code sub-agents documentation](https://docs.anthropic.com/en/docs/claude-code/sub-agents).

## Hooks

Custom hooks that enhance tool usage, configured in [`.claude/settings.json`](./.claude/settings.json):

### Setup

Make hook scripts executable after cloning:

```bash
chmod +x ./.claude/hooks/*.py
```

### Web Content Enhancement Hooks

These hooks redirect native Claude Code web tools to faster and more reliable Tavily alternatives. Native WebSearch/WebFetch tools take 20-30 seconds while Tavily equivalents complete in 1-2 seconds. Additionally, native WebFetch often fails on bot-protected websites while Tavily can bypass these protections.

- **[hook_webfetch_to_tavily_extract.py](./.claude/hooks/hook_webfetch_to_tavily_extract.py)**: Blocks WebFetch and suggests using Tavily extract with advanced depth
- **[hook_tavily_extract_to_advanced.py](./.claude/hooks/hook_tavily_extract_to_advanced.py)**: Enhances tavily-extract calls with advanced extraction depth for better content parsing
- **[hook_websearch_to_tavily_search.py](./.claude/hooks/hook_websearch_to_tavily_search.py)**: Blocks WebSearch and suggests using Tavily search instead

### Code Quality Hooks

Comprehensive auto-formatting system that covers all major file types, designed to eliminate formatting inconsistencies and reduce CI formatting noise.

- **Whitespace Cleanup** ([settings.json#L64-L74](./.claude/settings.json#L64-L74)): Automatically removes whitespace from empty lines in Python, JavaScript, and TypeScript files (`.py`, `.js`, `.jsx`, `.ts`, `.tsx`) after any Edit, MultiEdit, Write, or Task operation. Works cross-platform (macOS and Linux).

- **Python Code Quality** ([hook_python_code_quality.py](./.claude/hooks/hook_python_code_quality.py)): Automatically formats and lints Python files using ruff and docformatter after Edit/Write/MultiEdit operations. Matches [Ultralytics Actions](https://github.com/ultralytics/actions) pipeline exactly:
  - `ruff format --line-length 120`
  - `ruff check --fix --unsafe-fixes --extend-select I,D,UP --target-version py38`
  - `docformatter --wrap-summaries 120 --wrap-descriptions 120`
- **Prettier Formatting** ([hook_prettier_formatting.py](./.claude/hooks/hook_prettier_formatting.py)): Auto-formats JavaScript, TypeScript, CSS, JSON, YAML, HTML, Vue, and Svelte files using prettier. Skips lock files and model.json to prevent conflicts.

- **Markdown Formatting** ([hook_markdown_formatting.py](./.claude/hooks/hook_markdown_formatting.py)): Formats Markdown files with prettier, applying special tab-width 4 handling for documentation directories (matches [Ultralytics Actions](https://github.com/ultralytics/actions) docs formatting).

- **Bash/Shell Formatting** ([hook_bash_formatting.py](./.claude/hooks/hook_bash_formatting.py)): Formats shell scripts (`.sh`, `.bash`) using prettier-plugin-sh for consistent bash scripting style.

- **Ripgrep Enforcement** ([hook_enforce_rg_over_grep.py](./.claude/hooks/hook_enforce_rg_over_grep.py)): Blocks grep and find commands in Bash tool calls, suggesting rg (ripgrep) alternatives for better performance and more features.

#### Zero CI Formatting

This comprehensive formatting setup is designed to achieve **zero auto-formatting** from CI workflows like [Ultralytics Actions](https://github.com/ultralytics/actions). The hooks cover 95% of typical formatting needs:

- ✅ Python (ruff + docformatter)
- ✅ JavaScript/TypeScript (prettier)
- ✅ CSS/SCSS/Less (prettier)
- ✅ JSON/YAML (prettier)
- ✅ HTML/Vue/Svelte (prettier)
- ✅ Markdown (prettier with docs handling)
- ✅ Shell scripts (prettier-plugin-sh)
- ✅ Whitespace cleanup

All hooks gracefully degrade when tools aren't available, never disrupting Claude Code operations. Python formatting configuration inspired by [onuralpszr's setup](https://github.com/onuralpszr/onuralpszr/blob/main/configs/git-hooks/pre-commit-line-120).

For more details, see the [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks).

## Commands

Custom Claude Code commands that make life easier, stored in [`.claude/commands/`](./.claude/commands/):

- [`apply-thinking-to.md`](./.claude/commands/apply-thinking-to.md) - Prompt enhancement using advanced thinking patterns (inspired by [centminmod's version](https://github.com/centminmod/my-claude-code-setup/blob/master/.claude/commands/anthropic/apply-thinking-to.md))
- [`commit-staged-changes.md`](./.claude/commands/commit-staged-changes.md) - Automated commit creation with conventional commit messages
- [`explain-architecture-pattern.md`](./.claude/commands/explain-architecture-pattern.md) - Identify and explain architectural patterns and design decisions
- [`update-pr-summary.md`](./.claude/commands/update-pr-summary.md) - Generate PR summaries with advanced analytical frameworks

## Extra Resources

- [Claude MCP Server Setup](https://docs.anthropic.com/en/docs/claude-code/mcp#project-scope)

- [Claude Code Commands Setup](https://docs.anthropic.com/en/docs/claude-code/slash-commands#command-types)

## Thank you for the support!

[![Star History Chart](https://api.star-history.com/svg?repos=fcakyon/claude-settings&type=Date)](https://www.star-history.com/#fcakyon/claude-settings&Date)
