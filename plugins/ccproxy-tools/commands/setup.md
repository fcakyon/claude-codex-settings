---
description: Configure ccproxy/LiteLLM to use Claude Code with any LLM provider
---

# ccproxy-tools Setup

Configure Claude Code to use ccproxy/LiteLLM with Claude Pro/Max subscription, GitHub Copilot, or other LLM providers.

## Step 1: Check Prerequisites

Check if required tools are installed:

```bash
which uv
uv tool list | grep -E "litellm|ccproxy" || echo "Not installed"
```

If not installed, show:

```
Install ccproxy and LiteLLM:
uv tool install 'litellm[proxy]' 'ccproxy'
```

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

## Step 3: Provider-Specific Setup

### If Claude Pro/Max (ccproxy)

Tell the user:

```
Claude Pro/Max Setup via ccproxy:

1. Initialize ccproxy config:
   ccproxy init

2. Start the proxy server:
   ccproxy start

   The proxy runs on http://localhost:4000

3. When prompted, authenticate via browser with your Claude subscription.

4. I'll update your .claude/settings.json with:
   - ANTHROPIC_BASE_URL: http://localhost:4000

5. Restart Claude Code to apply changes.

Note: Keep ccproxy running in a terminal or use tmux:
tmux new-session -d -s ccproxy 'ccproxy start'
```

Update `.claude/settings.json` env section with:

```json
{
  "ANTHROPIC_BASE_URL": "http://localhost:4000"
}
```

### If GitHub Copilot (LiteLLM)

Tell the user:

```
GitHub Copilot Setup via LiteLLM:

1. Create LiteLLM config at ~/.litellm/config.yaml with the content I'll provide.

2. Start LiteLLM proxy:
   litellm --config ~/.litellm/config.yaml

   The proxy runs on http://localhost:4000

3. When you see "Please visit ... and enter code XXXX-XXXX to authenticate"
   Open the link and authenticate with your GitHub Copilot account.

4. I'll update your .claude/settings.json with:
   - ANTHROPIC_BASE_URL: http://localhost:4000
   - ANTHROPIC_AUTH_TOKEN: sk-dummy
   - Model mappings for opus/sonnet/haiku

5. Restart Claude Code to apply changes.

Note: Keep LiteLLM running in a terminal or use tmux:
tmux new-session -d -s litellm 'litellm --config ~/.litellm/config.yaml'
```

Create `~/.litellm/config.yaml`:

```yaml
general_settings:
  master_key: sk-dummy
litellm_settings:
  drop_params: true
model_list:
  - model_name: claude-opus-4
    litellm_params:
      model: github_copilot/claude-opus-4
      extra_headers:
        editor-version: "vscode/1.104.3"
        editor-plugin-version: "copilot-chat/0.26.7"
        Copilot-Integration-Id: "vscode-chat"
        user-agent: "GitHubCopilotChat/0.26.7"
        x-github-api-version: "2025-04-01"
  - model_name: claude-sonnet-4.5
    litellm_params:
      model: github_copilot/claude-sonnet-4.5
      extra_headers:
        editor-version: "vscode/1.104.3"
        editor-plugin-version: "copilot-chat/0.26.7"
        Copilot-Integration-Id: "vscode-chat"
        user-agent: "GitHubCopilotChat/0.26.7"
        x-github-api-version: "2025-04-01"
  - model_name: gpt-5-mini
    litellm_params:
      model: github_copilot/gpt-5-mini
      extra_headers:
        editor-version: "vscode/1.104.3"
        editor-plugin-version: "copilot-chat/0.26.7"
        Copilot-Integration-Id: "vscode-chat"
        user-agent: "GitHubCopilotChat/0.26.7"
        x-github-api-version: "2025-04-01"
  - model_name: "*"
    litellm_params:
      model: "github_copilot/*"
      extra_headers:
        editor-version: "vscode/1.104.3"
        editor-plugin-version: "copilot-chat/0.26.7"
        Copilot-Integration-Id: "vscode-chat"
        user-agent: "GitHubCopilotChat/0.26.7"
        x-github-api-version: "2025-04-01"
```

Update `.claude/settings.json` env section with:

```json
{
  "ANTHROPIC_BASE_URL": "http://localhost:4000",
  "ANTHROPIC_AUTH_TOKEN": "sk-dummy",
  "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4",
  "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4.5",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gpt-5-mini"
}
```

### If OpenAI API (LiteLLM)

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
  - model_name: claude-opus-4
    litellm_params:
      model: openai/gpt-5
      api_key: YOUR_OPENAI_KEY
  - model_name: claude-sonnet-4.5
    litellm_params:
      model: openai/gpt-5
      api_key: YOUR_OPENAI_KEY
  - model_name: "*"
    litellm_params:
      model: openai/gpt-5-mini
      api_key: YOUR_OPENAI_KEY
```

Update `.claude/settings.json` env section with:

```json
{
  "ANTHROPIC_BASE_URL": "http://localhost:4000",
  "ANTHROPIC_AUTH_TOKEN": "sk-dummy",
  "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4",
  "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4.5",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gpt-5-mini"
}
```

### If Gemini API (LiteLLM)

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
  - model_name: claude-opus-4
    litellm_params:
      model: gemini/gemini-2.5-pro
      api_key: YOUR_GEMINI_KEY
  - model_name: claude-sonnet-4.5
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: YOUR_GEMINI_KEY
  - model_name: "*"
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: YOUR_GEMINI_KEY
```

Update `.claude/settings.json` env section with:

```json
{
  "ANTHROPIC_BASE_URL": "http://localhost:4000",
  "ANTHROPIC_AUTH_TOKEN": "sk-dummy",
  "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4",
  "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4.5",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gpt-5-mini"
}
```

## Step 4: Update Settings

1. Read current `.claude/settings.json`
2. Create backup at `.claude/settings.json.backup`
3. Merge the provider-specific env variables into the existing env section
4. Write updated settings back

## Step 5: Confirm Success

Tell the user:

```
Configuration complete!

IMPORTANT: Restart Claude Code for changes to take effect.
- Exit Claude Code
- Start the proxy (ccproxy start OR litellm --config ~/.litellm/config.yaml)
- Run `claude` again

To verify after restart:
- Claude Code should connect to the proxy at localhost:4000
- Check proxy terminal for request logs

Troubleshooting:
- Run /ccproxy-tools:setup again if issues occur
- Check proxy is running: curl http://localhost:4000/health
- See ccproxy docs: https://github.com/starbased-co/ccproxy
```
