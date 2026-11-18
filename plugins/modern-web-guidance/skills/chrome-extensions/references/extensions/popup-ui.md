# Popup UI

## Setup

```json
{
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    },
    "default_title": "My Extension"
  }
}
```

## Key Constraints

- Popup closes when the user clicks outside it — don't rely on it staying open
- Default max size: 800x600 px. Set size via CSS on body/html
- All scripts must be external files (CSP — no inline scripts)
- All event listeners must use `addEventListener` (no inline handlers)

## Popup HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 350px; min-height: 200px; padding: 16px; font-family: system-ui; }
  </style>
</head>
<body>
  <h1>My Extension</h1>
  <div id="content"></div>
  <script src="popup.js"></script>
</body>
</html>
```

## Persistence

Popup state is lost when closed. Use `chrome.storage` for persistence:

```js
// Save on change
document.getElementById('input').addEventListener('input', (e) => {
  chrome.storage.local.set({ savedInput: e.target.value });
});

// Restore on open
document.addEventListener('DOMContentLoaded', async () => {
  const { savedInput = '' } = await chrome.storage.local.get('savedInput');
  document.getElementById('input').value = savedInput;
});
```

Note: `localStorage` technically works in popups (they have a persistent origin), but
`chrome.storage` is strongly preferred because it works across all extension contexts
and supports sync.

## Communicating with Service Worker

```js
// From popup
const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });

// Long-lived connection
const port = chrome.runtime.connect({ name: 'popup' });
port.postMessage({ type: 'INIT' });
port.onMessage.addListener((msg) => { /* handle */ });
```

## Dynamic Popup vs No Popup

If you want the action click to do something instead of showing a popup, remove
`default_popup` and use `chrome.action.onClicked`:

```js
// In service worker — only fires if NO popup is set
chrome.action.onClicked.addListener((tab) => {
  // Open side panel, inject script, etc.
});
```

You can toggle between popup and no-popup dynamically:
```js
chrome.action.setPopup({ popup: 'popup/popup.html' }); // Enable popup
chrome.action.setPopup({ popup: '' }); // Disable popup (enables onClicked)
```
