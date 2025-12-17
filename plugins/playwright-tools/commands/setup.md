---
description: Configure Playwright MCP
---

# Playwright Tools Setup

**Source:** [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)

Check Playwright MCP status and configure browser dependencies if needed.

## Step 1: Test Current Setup

Run `/mcp` command to check if playwright server is listed and connected.

If playwright server shows as connected: Tell user Playwright is configured and working.

If playwright server is missing or shows connection error: Continue to Step 2.

## Step 2: Browser Installation

Tell the user:

```
Playwright MCP requires browser binaries. Install them with:

npx playwright install

This installs Chromium, Firefox, and WebKit browsers.

For a specific browser only:
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

## Step 3: Browser Options

The MCP server supports these browsers via the `--browser` flag in `.mcp.json`:

- `chrome` (default)
- `firefox`
- `webkit`
- `msedge`

Example `.mcp.json` for Firefox:

```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--browser", "firefox"]
  }
}
```

## Step 4: Headless Mode

For headless operation (no visible browser), add `--headless`:

```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--headless"]
  }
}
```

## Step 5: Restart

Tell the user:

```
After making changes:
1. Exit Claude Code
2. Run `claude` again

Changes take effect after restart.
```

## Troubleshooting

If Playwright MCP fails:

```
Common fixes:
1. Browser not found - Run `npx playwright install`
2. Permission denied - Check file permissions on browser binaries
3. Display issues - Use `--headless` flag for headless mode
4. Timeout errors - Increase timeout with `--timeout-navigation 120000`
```

## Alternative: Disable Plugin

If user doesn't need browser automation:

```
To disable this plugin:
1. Run /mcp command
2. Find the playwright server
3. Disable it

This prevents errors from missing browser binaries.
```
