---
description: Configure GCloud CLI authentication
---

# GCloud Tools Setup

Check GCloud MCP status and configure CLI authentication if needed.

## Step 1: Check gcloud CLI

Run: `gcloud --version`

If not installed: Continue to Step 2.
If installed: Skip to Step 3.

## Step 2: Install gcloud CLI

Tell the user:

```
Install Google Cloud SDK:

macOS (Homebrew):
  brew install google-cloud-sdk

macOS/Linux (Manual):
  curl https://sdk.cloud.google.com | bash
  exec -l $SHELL

Windows:
  Download from: https://cloud.google.com/sdk/docs/install

After install, restart your terminal.
```

## Step 3: Authenticate

Run these commands:

```bash
# Login with your Google account
gcloud auth login

# Set up Application Default Credentials (required for MCP)
gcloud auth application-default login
```

Both commands will open a browser for authentication.

## Step 4: Set Default Project

```bash
# List available projects
gcloud projects list

# Set default project
gcloud config set project YOUR_PROJECT_ID
```

## Step 5: Verify Setup

Run: `gcloud auth list`

Should show your authenticated account with asterisk (\*).

## Step 6: Restart Claude Code

Tell the user:

```
After authentication:
1. Exit Claude Code
2. Run `claude` again

The MCP will use your gcloud credentials.
```

## Troubleshooting

If GCloud MCP fails:

```
Common fixes:
1. ADC not found - Run gcloud auth application-default login
2. Project not set - Run gcloud config set project PROJECT_ID
3. Permission denied - Check IAM roles in Cloud Console
4. Quota exceeded - Check quotas in Cloud Console
5. Token expired - Run gcloud auth application-default login again
```

## Alternative: Disable Plugin

If user doesn't need GCloud integration:

```
To disable this plugin:
1. Run /mcp command
2. Find the gcloud-observability server
3. Disable it

This prevents errors from missing authentication.
```
