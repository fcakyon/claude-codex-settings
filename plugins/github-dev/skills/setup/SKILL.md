---
name: setup
description: This skill should be used when the user asks "how to setup GitHub CLI", "configure gh", "gh auth not working", "GitHub CLI connection failed", "gh CLI error", or needs help with GitHub authentication.
---

# GitHub CLI Setup

Configure `gh` CLI for GitHub access.

## Quick Setup

```bash
gh auth login
```

Select: GitHub.com → HTTPS → Login with browser

## Verify Authentication

```bash
gh auth status
gh api user --jq '.login'
```

## Troubleshooting

If `gh` commands fail:

1. **Check authentication** - `gh auth status`
2. **Re-login if needed** - `gh auth login`
3. **Check scopes** - Ensure token has repo access
4. **Update gh** - `brew upgrade gh` or equivalent
