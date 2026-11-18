# User Scripts API

The `chrome.userScripts` API lets extensions run **arbitrary code provided by the user** at
runtime — code that cannot be shipped as part of the extension package. This is fundamentally
different from content scripts (which are bundled with the extension) and `chrome.scripting`
(which executes extension-owned code programmatically).

**Use userScripts when:** you are building a script manager, custom automation tool, or any
feature where the user supplies JavaScript that should run on web pages.  
**Use content scripts when:** the injected code is written by you and ships with the extension.  
**Use `chrome.scripting.executeScript` when:** you need one-off execution of known, extension-owned code.

## Manifest

```json
{
  "manifest_version": 3,
  "minimum_chrome_version": "120",
  "permissions": ["userScripts"],
  "host_permissions": ["https://example.com/*"]
}
```

- `"userScripts"` permission is required — without it `chrome.userScripts` is undefined.
- `host_permissions` must cover the sites where scripts will be injected.

## User Enablement — CRITICAL

**The `chrome.userScripts` API requires explicit user opt-in. Without it, the API throws on
property access.** Behavior differs by Chrome version:

| Chrome version | Requirement |
|----------------|-------------|
| < 138 | User must enable **Developer mode** at `chrome://extensions` |
| ≥ 138 | User must toggle **"Allow User Scripts"** on the extension's details page |

```js
// ❌ BROKEN — crashes if user hasn't enabled the API
await chrome.userScripts.register([{ id: 'foo', matches: [...], js: [...] }]);
// TypeError: Cannot read properties of undefined

// ✅ CORRECT — always guard before any chrome.userScripts.* call
function isUserScriptsAvailable() {
  try {
    chrome.userScripts; // throws if not enabled
    return true;
  } catch {
    return false;
  }
}

if (!isUserScriptsAvailable()) {
  document.getElementById('warning').style.display = 'block';
  document.getElementById('main-ui').style.display = 'none';
  return;
}
```

## Execution Worlds

| World | Constant | Behavior |
|-------|----------|----------|
| **USER_SCRIPT** (default) | `ExecutionWorld.USER_SCRIPT` | Isolated from host page JS; exempt from page CSP |
| **MAIN** | `ExecutionWorld.MAIN` | Shares JS context with the host page; can access page variables |

Use `USER_SCRIPT` (the default) for safety. Use `MAIN` only when the user's script explicitly
needs to interact with the host page's JavaScript environment.

Chrome 133+ supports multiple isolated worlds via `worldId`, letting different user scripts
run in separate execution environments without interfering with each other.

## Registering Scripts (Persistent)

`register()` / `update()` / `getScripts()` / `unregister()` manage scripts that persist across
page loads and browser sessions. Registered scripts survive the service worker being terminated.

```js
// ❌ BROKEN — both code and file specified (ScriptSource must have exactly one)
await chrome.userScripts.register([{
  id: 'my-script',
  matches: ['https://example.com/*'],
  js: [{ code: 'alert(1)', file: 'user-script.js' }] // Error: specify code OR file, not both
}]);

// ❌ BROKEN — id starts with underscore (reserved prefix)
await chrome.userScripts.register([{ id: '_my-script', ... }]);
// Error: User script IDs must not start with '_'

// ✅ CORRECT — register from a file bundled with the extension
await chrome.userScripts.register([{
  id: 'my-user-script',
  matches: ['https://example.com/*'],
  js: [{ file: 'user-script.js' }],
  runAt: 'document_idle'  // optional, this is the default
}]);

// ✅ CORRECT — register inline code supplied by the user
await chrome.userScripts.register([{
  id: 'my-user-script',
  matches: ['https://example.com/*'],
  js: [{ code: userProvidedCode }]
}]);
```

Always check before calling `register()` vs `update()` — registering an already-existing ID
throws an error:

```js
const existing = await chrome.userScripts.getScripts({ ids: ['my-user-script'] });
if (existing.length > 0) {
  await chrome.userScripts.update([{ id: 'my-user-script', js: [{ code: updatedCode }] }]);
} else {
  await chrome.userScripts.register([{
    id: 'my-user-script',
    matches: ['https://example.com/*'],
    js: [{ code: userProvidedCode }]
  }]);
}

// Remove a specific script
await chrome.userScripts.unregister({ ids: ['my-user-script'] });

// Remove all registered user scripts
await chrome.userScripts.unregister();
```

## Persistence: Restore on Extension Update

**Registered user scripts are cleared when the extension updates.**

```js
// ❌ BROKEN — scripts registered once at install time are lost on every update
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.userScripts.register([{ id: 'foo', matches: [...], js: [...] }]);
    // After the next extension update, 'foo' is gone — no re-registration
  }
});

// ✅ CORRECT — persist configs in storage, restore on both install and update
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.UPDATE) {
    const { scripts = {} } = await chrome.storage.local.get('scripts');
    for (const s of Object.values(scripts)) {
      await chrome.userScripts.register([s]).catch(() => {});
    }
  }
});
```

Save the full script config (id, matches, js) to `chrome.storage` whenever the user saves
a script, so it can be restored after an update.

## One-Off Injection (Chrome 135+)

`execute()` injects a script immediately into a specific tab/frame without registering it. It
does not persist across page loads.

```js
// Requires Chrome 135+
const results = await chrome.userScripts.execute({
  target: { tabId: tabId },
  js: [{ code: userProvidedCode }],
  world: 'USER_SCRIPT'  // optional, default
});

for (const result of results) {
  if (result.error) {
    console.error('Injection failed in frame', result.frameId, result.error);
  } else {
    console.log('Result from frame', result.frameId, result.result);
  }
}
```

Guard for Chrome 135+ availability:

```js
if (typeof chrome.userScripts.execute === 'function') {
  await chrome.userScripts.execute({ ... });
} else {
  // Fall back to register-based approach
}
```

## Messaging from User Scripts

User scripts run in the `USER_SCRIPT` world which has no access to `chrome.runtime` by
default. Messaging requires an explicit opt-in.

```js
// ❌ BROKEN — messaging not enabled; chrome.runtime is undefined in the user script
// sw.js
chrome.runtime.onMessage.addListener((msg) => { ... }); // Never fires from user scripts

// user script code (running in the page)
chrome.runtime.sendMessage({ type: 'hello' }); // TypeError: chrome is not defined

// ✅ CORRECT — opt in first, then use the dedicated listener
// sw.js (run once, e.g. on install)
await chrome.userScripts.configureWorld({ messaging: true });

// sw.js — listen on the dedicated handler, not onMessage
chrome.runtime.onUserScriptMessage.addListener((message, sender, sendResponse) => {
  sendResponse({ ok: true });
  return true; // keep channel open for async responses
});

// user script code — chrome.runtime is now available
chrome.runtime.sendMessage({ type: 'FROM_USER_SCRIPT', data: 42 });
```

For long-lived connections use `chrome.runtime.onUserScriptConnect` (analogous to
`runtime.onConnect` for content scripts).

Chrome 133+ supports per-world messaging with `worldId`:

```js
await chrome.userScripts.configureWorld({ worldId: 'my-world', messaging: true });
```

## `configureWorld()` — CSP and Messaging

```js
await chrome.userScripts.configureWorld({
  csp: "script-src 'self'",  // custom CSP for the world
  messaging: true             // enable chrome.runtime messaging
});

// Chrome 133+: configure a named world
await chrome.userScripts.configureWorld({
  worldId: 'my-world',
  messaging: true
});

// Chrome 133+: reset a world's configuration
await chrome.userScripts.resetWorldConfiguration('my-world');

// Chrome 133+: list all world configurations
const configs = await chrome.userScripts.getWorldConfigurations();
```

## Complete Script Manager Pattern

```js
// options.js — save user's script and (re)register it
async function saveScript(id, matches, code) {
  // Persist the config so we can restore it after extension updates
  const { scripts = {} } = await chrome.storage.local.get('scripts');
  scripts[id] = { id, matches, js: [{ code }] };
  await chrome.storage.local.set({ scripts });

  // Register or update the live script
  const existing = await chrome.userScripts.getScripts({ ids: [id] });
  if (existing.length > 0) {
    await chrome.userScripts.update([{ id, matches, js: [{ code }] }]);
  } else {
    await chrome.userScripts.register([{ id, matches, js: [{ code }] }]);
  }
}
```

## Key Differences from Content Scripts

| | Content Scripts | userScripts |
|--|-----------------|-------------|
| Code source | Bundled with extension | Provided by user at runtime |
| Persistence | Automatic (manifest) | Manual (register + restore on update) |
| Arbitrary code | No | Yes |
| User opt-in | No | Yes (Developer Mode / Allow User Scripts) |
| Messaging | `runtime.sendMessage` | `runtime.onUserScriptMessage` (after `configureWorld`) |
| CSP exemption | Yes | Yes (USER_SCRIPT world) |
| Multiple worlds | No | Yes (Chrome 133+ with `worldId`) |
