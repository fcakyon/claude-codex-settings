---
name: setup
description: This skill should be used when user encounters "ADC not found", "gcloud auth error", "GCloud MCP error", "Application Default Credentials", "project not set", or needs help configuring GCloud integration.
---

# GCloud Tools Setup

Run `/gcloud-tools:setup` to configure GCloud MCP.

## Quick Fixes

- **ADC not found** - Run `gcloud auth application-default login`
- **Project not set** - Run `gcloud config set project PROJECT_ID`
- **Permission denied** - Check IAM roles in Cloud Console

## Don't Need GCloud?

Disable via `/mcp` command to prevent errors.
