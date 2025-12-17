---
name: setup
description: This skill should be used when user encounters "ccproxy not found", "LiteLLM connection failed", "localhost:4000 refused", "OAuth failed", "proxy not running", or needs help configuring ccproxy/LiteLLM integration.
---

# ccproxy-tools Setup

Run `/ccproxy-tools:setup` to configure ccproxy/LiteLLM.

## Quick Fixes

- **ccproxy/litellm not found** - Install with `uv tool install 'litellm[proxy]' 'ccproxy'`
- **Connection refused localhost:4000** - Start proxy: `ccproxy start` or `litellm --config ~/.litellm/config.yaml`
- **OAuth failed** - Re-run `ccproxy init` and authenticate via browser
- **Invalid model name** - Check model names in `.claude/settings.json` match LiteLLM config
- **Changes not applied** - Restart Claude Code after updating settings

## Environment Variables

Key settings in `.claude/settings.json` → `env`:

| Variable                         | Purpose                                |
| -------------------------------- | -------------------------------------- |
| `ANTHROPIC_BASE_URL`             | Proxy endpoint (http://localhost:4000) |
| `ANTHROPIC_AUTH_TOKEN`           | Auth token for proxy                   |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`   | Opus model name                        |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Sonnet model name                      |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`  | Haiku model name                       |

## Check Proxy Health

```bash
curl http://localhost:4000/health
```

## Resources

- ccproxy: https://github.com/starbased-co/ccproxy
- LiteLLM: https://docs.litellm.ai
