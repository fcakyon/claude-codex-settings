---
description: Configure Azure MCP server with Azure CLI authentication
---

# Azure Tools Setup

Configure the Azure MCP server with Azure CLI authentication.

## Step 1: Check Prerequisites

Check if Azure CLI is installed:

```bash
az --version
```

Check if Node.js is installed:

```bash
node --version
```

Report status based on results.

## Step 2: Show Installation Guide

If Azure CLI is missing, tell the user:

```
Azure CLI is required for Azure MCP authentication.

Install Azure CLI:
- macOS: brew install azure-cli
- Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
- Windows: winget install Microsoft.AzureCLI

After installing, restart your terminal and run this setup again.
```

If Node.js is missing, tell the user:

```
Node.js 20 LTS or later is required for Azure MCP.

Install Node.js:
- macOS: brew install node@20
- Linux: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
- Windows: winget install OpenJS.NodeJS.LTS

After installing, restart your terminal and run this setup again.
```

## Step 3: Check Authentication

If prerequisites are installed, check Azure login status:

```bash
az account show
```

If not logged in, tell the user:

```
You need to authenticate to Azure.

Run: az login

This opens a browser for authentication. After signing in, you can close the browser.
```

## Step 4: Verify Configuration

After authentication, verify:

1. Read `${CLAUDE_PLUGIN_ROOT}/.mcp.json` to confirm Azure MCP is configured
2. Tell the user the current configuration

## Step 5: Confirm Success

Tell the user:

```
Azure MCP is configured!

IMPORTANT: Restart Claude Code for changes to take effect.
- Exit Claude Code
- Run `claude` again

To verify after restart, run /mcp and check that 'azure' server is connected.

Reference: https://github.com/microsoft/mcp/tree/main/servers/Azure.Mcp.Server
```
