---
name: setup
description: This skill should be used when the user asks to "set up paper search", reports "paper-search command not found", wants to "replace paper search MCP", or needs help with paper search credentials.
---

# Set up Paper Search CLI

Use [fcakyon/paper-search-cli](https://github.com/fcakyon/paper-search-cli) for paper searches, DOI lookup, PDF downloads, and text extraction. It requires uv and Python 3.10+; Docker and an MCP server are unnecessary.

1. Run `uv --version`. If missing, follow the [uv installation instructions](https://docs.astral.sh/uv/getting-started/installation/).
2. Install the CLI:

   ```bash
   uv tool install 'git+https://github.com/fcakyon/paper-search-cli'
   ```

3. Run `paper-search --help` and `paper-search sources`. If the command is not on PATH, run `uv tool update-shell` and open a new shell.
4. Check a public source:

   ```bash
   paper-search search 'object detection' -s crossref -n 3
   ```

Inspect the JSON `errors` field before declaring the search successful. An empty result or a provider error does not confirm working access.

For updates, run `uv tool upgrade paper-search-cli`.

## Credentials

Use the CLI's [.env.example](https://github.com/fcakyon/paper-search-cli/blob/main/.env.example) for provider keys. Its current configuration path is `~/.config/paper-search-mcp/.env`; the legacy path and `PAPER_SEARCH_MCP_*` names remain supported. Do not print secret values.

IEEE, Scopus, and Web of Science need credentials. Scopus and Web of Science require explicit source selection. Unpaywall needs an email. Metadata access does not guarantee access to a PDF.

## Migrate from the MCP plugin

This plugin no longer registers the Docker MCP server. Reload the updated plugin to discard its old registration. If the user separately configured a `paper-search` MCP entry, identify that entry and remove it only when requested; preserve other servers. Run CLI commands directly without waiting for an MCP connection.
