---
name: setup
description: This skill should be used when user asks to "set up overleaf", "configure overleaf cookie", "overleaf auth failed", "overleaf 401", "overleaf session expired", "overleaf unauthorized", or needs to install or refresh their Overleaf session cookie for the overleaf-skills plugin.
---

# Overleaf Skills Setup

Walk the user through pasting a fresh `overleaf_session2` cookie into `~/.claude/overleaf-skills/cookie`. Cookies slide ~5 days idle; users will hit this every few days.

## Step 1: Status check

Check if `~/.claude/overleaf-skills/cookie` already exists. If yes, run:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/overleaf_reviews.py --check-auth
```

- If `OK <email>`: tell user "Already configured, logged in as <email>". Ask via AskUserQuestion whether to refresh or keep.
- If `FAIL`: tell user the stored cookie is expired and continue to Step 2.

## Step 2: Show browser guide

Tell the user to grab the cookie from their browser. Give all three branches; pick none for them:

**Chrome / Edge / Brave / Arc:** `Cmd+Option+I` (mac) or `F12` → **Application** tab → **Storage → Cookies → https://www.overleaf.com** → row where Name = `overleaf_session2` → double-click Value cell → `Cmd+A` → `Cmd+C`.

**Firefox:** `F12` → **Storage** tab (enable in DevTools settings if hidden) → **Cookies → https://www.overleaf.com** → click `overleaf_session2` row → right-click → **Copy Value**.

**Safari:** Enable Develop menu (**Settings → Advanced → Show features for web developers**), then `Cmd+Option+I` → **Storage** → **Cookies → www.overleaf.com** → click `overleaf_session2` row → copy from right-hand detail pane.

Add three warnings at the bottom:

1. The row name is `overleaf_session2` (UNDERSCORE). A row named `overleaf.session2` (DOT) is a stale legacy cookie that will not authenticate.
2. The cookie is `HttpOnly` — `document.cookie` in the JS console returns empty for it. The storage panel is the only path.
3. The value should start with `s%3A` and be ~80+ chars. If it starts with `s%3Ac%3A1%3A`, you're logged out — log into overleaf.com and re-grab.

## Step 3: Capture

Use AskUserQuestion: "Do you have your `overleaf_session2` cookie value ready?" with options "Yes, paste it now" and "Skip for now". The user pastes via the "Other" free-text field.

## Step 4: Validate

Normalize the input: strip whitespace; if it does NOT start with `overleaf_session2=`, prepend it (accept bare value).

Reject (re-prompt with reason):

- Starts with `overleaf.session2=` → "Overleaf renamed this cookie to `overleaf_session2` (underscore). Re-grab the underscore row."
- Value (after the `=`) starts with `s%3Ac%3A1%3A` → "That's an anonymous-visitor cookie. Log into overleaf.com first, then re-grab."
- Value does not start with `s%3A` after the `=` → "Doesn't look like an Overleaf session cookie. Confirm you copied from the `overleaf_session2` row on www.overleaf.com."
- Total length under 80 chars → "Cookie looks truncated. Re-copy with `Cmd+A` inside the Value cell."
- Contains newlines or quotes → "Strip the surrounding quotes/newlines."

## Step 5: Write

```bash
mkdir -p ~/.claude/overleaf-skills
[ -f ~/.claude/overleaf-skills/cookie ] && cp ~/.claude/overleaf-skills/cookie ~/.claude/overleaf-skills/cookie.backup
# Write the normalized value (one line, no trailing newline beyond what's natural)
printf '%s\n' "<normalized-cookie>" > ~/.claude/overleaf-skills/cookie
chmod 600 ~/.claude/overleaf-skills/cookie
```

## Step 6: Verify

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/overleaf_reviews.py --check-auth
```

- If `OK <email>`: report "Configured. Logged in as <email>." Done.
- If `FAIL`: restore from `cookie.backup` if it exists (`mv ~/.claude/overleaf-skills/cookie.backup ~/.claude/overleaf-skills/cookie`), tell user the new cookie did not authenticate, loop back to Step 2.
