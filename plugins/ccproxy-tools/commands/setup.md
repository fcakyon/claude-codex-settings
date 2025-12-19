---
description: Configure ccproxy/LiteLLM to use Claude Code with any LLM provider
---

# ccproxy-tools Setup

Configure Claude Code to use ccproxy/LiteLLM with Claude Pro/Max subscription, GitHub Copilot, or other LLM providers.

## Step 1: Check Prerequisites

Check if `uv` is installed:

```bash
which uv
```

If not installed, install it:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then reload shell or run `source ~/.bashrc` (or `~/.zshrc`).

## Step 2: Ask Provider Choice

Use AskUserQuestion:

- question: "Which LLM provider do you want to use with Claude Code?"
- header: "Provider"
- options:
  - label: "Claude Pro/Max (ccproxy)"
    description: "Use your Claude subscription via OAuth - no API keys needed"
  - label: "GitHub Copilot (LiteLLM)"
    description: "Use GitHub Copilot subscription via LiteLLM proxy"
  - label: "OpenAI API (LiteLLM)"
    description: "Use OpenAI models via LiteLLM proxy"
  - label: "Gemini API (LiteLLM)"
    description: "Use Google Gemini models via LiteLLM proxy"

## Step 3: Install Proxy Tool

### If Claude Pro/Max (ccproxy)

Install and initialize ccproxy:

```bash
uv tool install ccproxy
ccproxy init
```

### If GitHub Copilot, OpenAI, or Gemini (LiteLLM)

Install LiteLLM:

```bash
uv tool install 'litellm[proxy]'
```

## Step 4: Configure LiteLLM (if applicable)

### For GitHub Copilot

Auto-detect VS Code and Copilot versions:

```bash
# Get VS Code version
VSCODE_VERSION=$(code --version 2> /dev/null | head -1 || echo "1.96.0")

# Find Copilot Chat extension version
COPILOT_VERSION=$(ls ~/.vscode/extensions/ 2> /dev/null | grep "github.copilot-chat-" | sed 's/github.copilot-chat-//' | sort -V | tail -1 || echo "0.26.7")
```

Create `~/.litellm/config.yaml` with detected versions:

```yaml
general_settings:
  master_key: sk-dummy
litellm_settings:
  drop_params: true
model_list:
  - model_name: "*"
    litellm_params:
      model: "github_copilot/*"
      extra_headers:
        editor-version: "vscode/${VSCODE_VERSION}"
        editor-plugin-version: "copilot-chat/${COPILOT_VERSION}"
        Copilot-Integration-Id: "vscode-chat"
        user-agent: "GitHubCopilotChat/${COPILOT_VERSION}"
```

### For OpenAI API

Ask for OpenAI API key using AskUserQuestion:

- question: "Enter your OpenAI API key (starts with sk-):"
- header: "OpenAI Key"
- options:
  - label: "I have it ready"
    description: "I'll paste my OpenAI API key"
  - label: "Skip for now"
    description: "I'll configure it later"

Create `~/.litellm/config.yaml`:

```yaml
general_settings:
  master_key: sk-dummy
litellm_settings:
  drop_params: true
model_list:
  - model_name: "*"
    litellm_params:
      model: openai/gpt-4o
      api_key: ${OPENAI_API_KEY}
```

### For Gemini API

Ask for Gemini API key using AskUserQuestion:

- question: "Enter your Gemini API key:"
- header: "Gemini Key"
- options:
  - label: "I have it ready"
    description: "I'll paste my Gemini API key"
  - label: "Skip for now"
    description: "I'll configure it later"

Create `~/.litellm/config.yaml`:

```yaml
general_settings:
  master_key: sk-dummy
litellm_settings:
  drop_params: true
model_list:
  - model_name: "*"
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: ${GEMINI_API_KEY}
```

## Step 5: Setup Auto-Start Service

Detect platform and create appropriate service:

### macOS (launchd)

For ccproxy, create `~/Library/LaunchAgents/com.ccproxy.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ccproxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>${HOME}/.local/bin/ccproxy</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${HOME}/.local/share/ccproxy/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${HOME}/.local/share/ccproxy/stderr.log</string>
</dict>
</plist>
```

For LiteLLM, create `~/Library/LaunchAgents/com.litellm.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.litellm</string>
    <key>ProgramArguments</key>
    <array>
        <string>${HOME}/.local/bin/litellm</string>
        <string>--config</string>
        <string>${HOME}/.litellm/config.yaml</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${HOME}/.local/share/litellm/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${HOME}/.local/share/litellm/stderr.log</string>
</dict>
</plist>
```

Load and start the service:

```bash
launchctl load ~/Library/LaunchAgents/com.ccproxy.plist # or com.litellm.plist
```

### Linux (systemd user service)

For ccproxy, create `~/.config/systemd/user/ccproxy.service`:

```ini
[Unit]
Description=ccproxy LLM Proxy

[Service]
ExecStart=%h/.local/bin/ccproxy start
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

For LiteLLM, create `~/.config/systemd/user/litellm.service`:

```ini
[Unit]
Description=LiteLLM Proxy

[Service]
ExecStart=%h/.local/bin/litellm --config %h/.litellm/config.yaml
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

Enable and start the service:

```bash
systemctl --user daemon-reload
systemctl --user enable --now ccproxy # or litellm
```

## Step 6: Authenticate (ccproxy only)

For ccproxy, tell the user:

```
The proxy is starting. A browser window will open for authentication.

1. Sign in with your Claude Pro/Max account
2. Authorize the connection
3. Return here after successful authentication
```

Wait for authentication to complete.

## Step 7: Verify Proxy is Running

Check if proxy is healthy:

```bash
curl -s http://localhost:4000/health
```

Retry up to 5 times with 3-second delays if not responding.

If proxy is not healthy after retries:

- Show error and troubleshooting steps
- Do NOT proceed to update settings
- Exit

## Step 8: Confirm Before Updating Settings

Use AskUserQuestion:

- question: "Proxy is running. Ready to configure Claude Code to use it?"
- header: "Configure"
- options:
  - label: "Yes, configure now"
    description: "Update settings to use the proxy (requires restart)"
  - label: "No, not yet"
    description: "Keep current settings, I'll configure later"

If user selects "No, not yet":

- Tell them they can run `/ccproxy-tools:setup` again when ready
- Exit without changing settings

## Step 9: Update Settings

1. Read current `~/.claude/settings.json`
2. Create backup at `~/.claude/settings.json.backup`
3. Add to env section based on provider:

For ccproxy:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4000"
  }
}
```

For LiteLLM:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4000",
    "ANTHROPIC_AUTH_TOKEN": "sk-dummy"
  }
}
```

4. Write updated settings

## Step 10: Confirm Success

Tell the user:

```
Configuration complete!

IMPORTANT: Restart Claude Code for changes to take effect.
- Exit Claude Code
- Run `claude` again

The proxy will start automatically on system boot.

To verify after restart:
- Claude Code should connect to the proxy at localhost:4000
- Check proxy logs: ~/Library/LaunchAgents/*.log (macOS) or journalctl --user -u ccproxy (Linux)
```

## Recovery Instructions

Always show these recovery instructions:

```
If Claude Code stops working after setup:

1. Check proxy status:
   curl http://localhost:4000/health

2. Restart proxy:
   macOS: launchctl kickstart -k gui/$(id -u)/com.ccproxy
   Linux: systemctl --user restart ccproxy

3. Check proxy logs:
   macOS: cat ~/.local/share/ccproxy/stderr.log
   Linux: journalctl --user -u ccproxy

4. Restore original settings (removes proxy):
   cp ~/.claude/settings.json.backup ~/.claude/settings.json

   Or manually edit ~/.claude/settings.json and remove:
   - ANTHROPIC_BASE_URL
   - ANTHROPIC_AUTH_TOKEN (if present)
```

## Troubleshooting

If proxy setup fails:

```
Common fixes:
1. Port in use - Check if another process uses port 4000: lsof -i :4000
2. Service not starting - Check logs in ~/.local/share/ccproxy/ or ~/.local/share/litellm/
3. Authentication failed - Re-run setup to re-authenticate
4. Permission denied - Ensure ~/.local/bin is in PATH
5. Config invalid - Verify ~/.litellm/config.yaml syntax
```
