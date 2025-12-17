---
description: Configure Paper Search MCP (requires Docker)
---

# Paper Search Tools Setup

Configure the Paper Search MCP server. Requires Docker.

## Step 1: Check Docker Installation

Run `docker --version` to check if Docker is installed.

If Docker is not installed, show:

```
Docker is required for Paper Search MCP.

Install Docker:

macOS:    brew install --cask docker
Linux:    curl -fsSL https://get.docker.com | sh
Windows:  winget install Docker.DockerDesktop

After installation, start Docker Desktop and wait for it to fully launch.
```

## Step 2: Verify Docker is Running

Run `docker info` to verify Docker daemon is running.

If not running, tell user:

```
Docker is installed but not running.

Start Docker Desktop and wait for it to fully launch before continuing.
```

## Step 3: Pull the Image

Run `docker pull mcp/paper-search` to download the MCP image.

Report progress:

- "Pulling paper-search image..."
- "Image ready!"

## Step 4: Confirm Success

Tell the user:

```
Paper Search MCP configured successfully!

IMPORTANT: Restart Claude Code for changes to take effect.
- Exit Claude Code
- Run `claude` again

To verify after restart, run /mcp and check that 'paper-search' server is connected.
```
