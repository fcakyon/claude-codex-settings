---
name: setup
description: "Configure GCloud CLI and MCP integration, resolve authentication errors, and set project defaults. Use when the user encounters ADC not found, gcloud auth error, GCloud MCP error, Application Default Credentials issues, project not set, or needs help configuring GCloud integration."
---

# GCloud Tools Setup

## Quick Start

1. Run `/gcloud-tools:setup` to configure GCloud MCP
2. Authenticate: `gcloud auth application-default login`
3. Set project: `gcloud config set project PROJECT_ID`

## Troubleshooting

| Error | Fix |
|-------|-----|
| ADC not found | `gcloud auth application-default login` |
| Project not set | `gcloud config set project PROJECT_ID` |
| Permission denied | Check IAM roles in Cloud Console |

## Don't Need GCloud?

Disable via `/mcp` command to prevent errors.
