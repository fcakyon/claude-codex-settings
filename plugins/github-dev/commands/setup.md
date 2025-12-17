---
description: Configure GitHub CLI authentication
---

# GitHub CLI Setup

**Source:** [github/github-mcp-server](https://github.com/github/github-mcp-server)

Configure `gh` CLI for GitHub access.

## Step 1: Check Current Status

Run `gh auth status` to check authentication state.

Report status:

- "GitHub CLI is not authenticated - needs login"
- OR "GitHub CLI is authenticated as <username>"

## Step 2: If Not Authenticated

Guide the user:

```
To authenticate with GitHub CLI:

gh auth login

This will open a browser for GitHub OAuth login.
Select: GitHub.com → HTTPS → Login with browser
```

## Step 3: Verify Setup

After login, verify with:

```bash
gh auth status
gh api user --jq '.login'
```

## Troubleshooting

If `gh` commands fail:

```
Common fixes:
1. Check authentication - gh auth status
2. Re-login - gh auth login
3. Missing scopes - re-auth with required permissions
4. Update gh CLI - brew upgrade gh (or equivalent)
5. Token expired - gh auth refresh
```
