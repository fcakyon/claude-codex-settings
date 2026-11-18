# DevTools Panels

## Setup

```json
{
  "devtools_page": "devtools/devtools.html"
}
```

The devtools page runs ONLY when DevTools is open. It's invisible — its job is to create panels.

## Creating a Panel

`devtools/devtools.html`:
```html
<!DOCTYPE html>
<html>
<body>
  <script src="devtools.js"></script>
</body>
</html>
```

`devtools/devtools.js`:
```js
chrome.devtools.panels.create(
  'My Panel',                    // Title shown in DevTools tab
  'icons/icon-16.png',           // Icon (optional, can be empty string)
  'devtools/panel/panel.html',   // Panel content page — RELATIVE TO EXTENSION ROOT
  (panel) => {
    // panel.onShown.addListener((window) => { ... });
    // panel.onHidden.addListener(() => { ... });
  }
);
```

**CRITICAL: The panel path is relative to the extension root**, NOT relative to the devtools.js
file. This is the most common DevTools extension bug.

```js
// ❌ WRONG — resolves to <ext-root>/panel/panel.html (file not found)
chrome.devtools.panels.create("My Panel", "", "panel/panel.html");

// ✅ CORRECT — resolves to <ext-root>/devtools/panel/panel.html
chrome.devtools.panels.create("My Panel", "", "devtools/panel/panel.html");
```

## Panel Content

`devtools/panel/panel.html` is a regular extension page with full chrome.* API access.

## Accessing DevTools APIs

Only available in the devtools page and panels:

```js
// Get inspected window's tab ID
const tabId = chrome.devtools.inspectedWindow.tabId;

// Evaluate JS in the inspected page
chrome.devtools.inspectedWindow.eval('document.title', (result, isException) => {
  console.log('Page title:', result);
});

// Monitor network requests
chrome.devtools.network.onRequestFinished.addListener((request) => {
  // request.request.url, request.response.status, etc.
  // HAR entry format
});

// Get all captured requests
chrome.devtools.network.getHAR((harLog) => {
  harLog.entries.forEach((entry) => { /* process */ });
});
```

## Communication Architecture

DevTools pages/panels CANNOT directly talk to the service worker via `chrome.runtime.sendMessage`
in all cases. Use a connection pattern:

```js
// In panel JS — connect to service worker
const port = chrome.runtime.connect({ name: 'devtools-panel' });
port.postMessage({ type: 'INIT', tabId: chrome.devtools.inspectedWindow.tabId });
port.onMessage.addListener((msg) => { /* handle */ });

// In service worker
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'devtools-panel') {
    port.onMessage.addListener((msg) => { /* handle */ });
  }
});
```

## Important Notes

- DevTools pages exist per-DevTools-window (one per inspected tab)
- They are destroyed when DevTools closes
- `chrome.devtools.*` APIs are ONLY available in the devtools page context, not in the service worker
- Panels can inject scripts into the inspected page via `chrome.devtools.inspectedWindow.eval()`
