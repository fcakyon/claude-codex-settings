---
name: setup
description: "Set up and troubleshoot GitHub CLI authentication, including login, token scopes, and connection issues. Use when the user asks how to set up GitHub CLI, configure gh, fix gh auth errors, resolve GitHub CLI connection failures, or needs help with GitHub authentication."
---

# GitHub CLI Setup

## Quick Start

1. Run `gh auth login`
2. Select: GitHub.com, HTTPS, Login with browser
3. Verify: `gh auth status`

```bash
# Full verification
gh auth status
gh api user --jq '.login'
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Auth expired | `gh auth login` |
| Missing scopes | Re-login and ensure token has `repo` access |
| CLI outdated | `brew upgrade gh` or equivalent |
| Commands fail | Run `gh auth status` to diagnose |
