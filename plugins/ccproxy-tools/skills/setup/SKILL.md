---
name: setup
description: "Configure and troubleshoot ccproxy/LiteLLM proxy integration for Claude Code. Use when the user encounters ccproxy not found errors, LiteLLM connection failures, localhost:4000 refused, OAuth failures, proxy not running, or needs to set up ccproxy from scratch. Handles installation, proxy startup, authentication, and model routing configuration."
---

# ccproxy-tools Setup

## Getting Started

1. Run `/ccproxy-tools:setup` to configure ccproxy/LiteLLM.
2. Install dependencies if missing: `uv tool install 'litellm[proxy]' 'ccproxy'`
3. Initialize with `ccproxy init` and authenticate via browser.
4. Start the proxy: `ccproxy start`
5. Verify the proxy is running:
   ```bash
   curl http://localhost:4000/health
   ```

## Troubleshooting

| Error | Fix |
| ----- | --- |
| ccproxy/litellm not found | `uv tool install 'litellm[proxy]' 'ccproxy'` |
| Connection refused localhost:4000 | Start proxy: `ccproxy start` or `litellm --config ~/.litellm/config.yaml` |
| OAuth failed | Re-run `ccproxy init` and authenticate via browser |
| Invalid model name | Check model names in `.claude/settings.json` match LiteLLM config |
| Changes not applied | Restart Claude Code after updating settings |

## Environment Variables

Key settings in `.claude/settings.json` under `env`:

| Variable                         | Purpose                                |
| -------------------------------- | -------------------------------------- |
| `ANTHROPIC_BASE_URL`             | Proxy endpoint (http://localhost:4000) |
| `ANTHROPIC_AUTH_TOKEN`           | Auth token for proxy                   |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`   | Opus model name                        |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Sonnet model name                      |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`  | Haiku model name                       |

## Resources

- ccproxy: https://github.com/starbased-co/ccproxy
- LiteLLM: https://docs.litellm.ai
