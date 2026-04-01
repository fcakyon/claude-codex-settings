## /home/cli

LiveKit docs › Understanding LiveKit › LiveKit CLI

---

# LiveKit CLI

> Manage your LiveKit Cloud projects and agents from the terminal

## Overview

The LiveKit CLI (`lk`) is the primary tool for working with LiveKit from the terminal. Use it to manage LiveKit Cloud projects, create apps from templates, and deploy and manage agents. The CLI integrates with LiveKit Cloud for authentication and project management, and also works with self-hosted LiveKit servers for local development.

- **[GitHub repository](https://github.com/livekit/livekit-cli)**: Source code and releases for the LiveKit CLI.

## Get started

To install the CLI, authenticate with LiveKit Cloud, and set up your first project, see the [CLI setup guide](https://docs.livekit.io/reference/developer-tools/livekit-cli.md#setup).

## Key workflows

A typical workflow starts with setting up a project, scaffolding an app from a template, and then deploying your agent to LiveKit Cloud.

### Project management

Add, list, and switch between LiveKit projects. Set a default project for all other commands. For LiveKit Cloud projects, authenticate with `lk cloud auth` to link your account and import projects.

- **[Project management reference](https://docs.livekit.io/reference/developer-tools/livekit-cli/projects.md)**: Learn how to add, list, and manage CLI projects.

### App templates

Scaffold new applications from first-party templates. Initialize agent projects, frontends, and token servers with your project credentials already configured.

- **[App templates reference](https://docs.livekit.io/reference/developer-tools/livekit-cli.md#app-templates)**: Browse available templates and learn how to create apps.

### Agent management

Create, deploy, update, and monitor agents on LiveKit Cloud. Manage secrets, view logs, roll back versions, and check agent status.

- **[Agent commands reference](https://docs.livekit.io/reference/developer-tools/livekit-cli/agent.md)**: Learn how to deploy and manage agents with the CLI.

### Docs search

Search and browse the LiveKit documentation directly from your terminal. Fetch pages, search SDK source code, and check changelogs — useful for quick lookups and for giving [coding agents](https://docs.livekit.io/intro/coding-agents.md) direct access to up-to-date LiveKit references.

- **[Docs search reference](https://docs.livekit.io/reference/developer-tools/livekit-cli/docs.md)**: Full command reference for `lk docs`.

---

For the latest version of this document, see [https://docs.livekit.io/intro/basics/cli.md](https://docs.livekit.io/intro/basics/cli.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).
