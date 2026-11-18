# Permissions

## `permissions` vs `host_permissions`

These are separate manifest keys — don't conflate them:

```json
{
  "permissions": ["tabs", "scripting", "storage"],
  "host_permissions": ["https://api.example.com/*"]
}
```

- `permissions` grants access to chrome.* APIs (`tabs`, `storage`, `scripting`, `desktopCapture`, etc.)
- `host_permissions` grants access to specific origins for `fetch`, `chrome.scripting.executeScript`, and reading tab URLs cross-origin

Scope `host_permissions` to specific domains rather than `<all_urls>` unless the extension genuinely needs to run on every site — broad host permissions draw extra Chrome Web Store review scrutiny.

## `tab.url` requires the `tabs` permission

Without it, `tab.url` and `tab.title` silently return `undefined` — no error thrown.

```js
// manifest.json — REQUIRED if you read tab.url or tab.title anywhere:
{ "permissions": ["tabs"] }
```

See `references/extensions/tab-management.md` for the full tabs/windows API.

## `activeTab` only works on direct user gestures — not from side panels

`activeTab` grants temporary access to the current tab ONLY when triggered by:
- Clicking the extension action icon
- A context menu item (including the `"tab"` context)
- A keyboard shortcut from the `commands` API
- Accepting an omnibox suggestion

It does **NOT** grant access when clicking a button in a side panel, a popup button that opens
later, or any programmatic trigger.

```js
// ❌ BROKEN — activeTab does NOT work from a side panel button click
document.getElementById('summarize').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => document.body.innerText });
});

// ✅ FIX — use "tabs" permission + specific host_permissions instead
// manifest.json: { "permissions": ["tabs", "scripting"], "host_permissions": ["<all_urls>"] }
```

See `references/extensions/side-panel.md` for the side-panel-specific writeup.

## `chrome.permissions.request()` needs a user gesture — the gesture survives one `sendMessage` hop, but not an `await` after that

`chrome.permissions.request()` (for optional/dynamic permissions) only works within a user
gesture (a click, keypress, etc.). A gesture from a UI context (side panel, popup) **does**
propagate across `chrome.runtime.sendMessage` to the service worker's `onMessage` listener — but
it's only good for that one synchronous turn. If the listener `await`s anything (a timer, a
storage read, another message round-trip) before calling `chrome.permissions.request()`, the
gesture is gone and the call throws `"This function must be called during a user gesture, such
as an onclick handler"`.

```js
// side-panel.js
button.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'REQUEST_PERMISSION' }, (granted) => { ... });
});

// service-worker.js

// ❌ BROKEN — an await before chrome.permissions.request() burns the gesture window
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'REQUEST_PERMISSION') {
    (async () => {
      await chrome.storage.local.get('someSetting'); // gesture is gone after this
      const granted = await chrome.permissions.request({ permissions: ['downloads'] });
      sendResponse(granted);
    })();
    return true;
  }
});

// ✅ CORRECT — call chrome.permissions.request() as the first thing in the listener,
// nothing awaited before it
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'REQUEST_PERMISSION') {
    chrome.permissions.request({ permissions: ['downloads'] }).then(sendResponse);
    return true; // fine to await the *result* — the call itself already happened synchronously
  }
});
```

**Rule of thumb:** call `chrome.permissions.request()` (or anything else gated on a user
gesture, like `activeTab`) as the very first statement of the message listener that receives the
click-triggered message — before any other `await`. Awaiting the *returned* promise afterward is
fine; awaiting anything *before* the call is what breaks it.

## Checking and removing permissions

```js
// Check whether an optional permission is currently granted
const hasIt = await chrome.permissions.contains({ permissions: ['downloads'] });

// Remove a previously granted optional permission
await chrome.permissions.remove({ permissions: ['downloads'] });
```

Declare optional permissions in the manifest so they're eligible to be requested at runtime:

```json
{ "optional_permissions": ["downloads"] }
```
