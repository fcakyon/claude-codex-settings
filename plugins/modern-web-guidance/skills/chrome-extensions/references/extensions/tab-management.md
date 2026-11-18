# Tab Management & Groups

## Permissions

```json
{
  "permissions": ["tabs", "tabGroups"]
}
```

Note: `tabs` permission gives access to `url`, `title`, `favIconUrl` on Tab objects.
Without it, you can still use `chrome.tabs` but won't see sensitive tab properties.

## Querying Tabs

```js
// All tabs
const allTabs = await chrome.tabs.query({});

// Active tab in current window
const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

// Tabs matching a URL pattern
const gmailTabs = await chrome.tabs.query({ url: '*://mail.google.com/*' });
```

## Tab Operations

```js
// Create
const tab = await chrome.tabs.create({ url: 'https://example.com', active: true });

// Update
await chrome.tabs.update(tabId, { url: 'https://new-url.com', pinned: true });

// Close
await chrome.tabs.remove(tabId);
await chrome.tabs.remove([tabId1, tabId2]); // Multiple

// Move
await chrome.tabs.move(tabId, { index: 0 }); // Move to first position

// Reload
await chrome.tabs.reload(tabId);
```

## Tab Groups

```js
// Create a group from tabs
const groupId = await chrome.tabs.group({ tabIds: [tabId1, tabId2] });

// Customize the group
await chrome.tabGroups.update(groupId, {
  title: 'Work',
  color: 'blue',     // grey, blue, red, yellow, green, pink, purple, cyan, orange
  collapsed: false
});

// Move tab into existing group
await chrome.tabs.group({ tabIds: [newTabId], groupId: existingGroupId });

// Ungroup
await chrome.tabs.ungroup(tabId);
```

## Grouping by Domain

```js
async function groupByDomain() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const byDomain = {};

  for (const tab of tabs) {
    try {
      const domain = new URL(tab.url).hostname;
      (byDomain[domain] ??= []).push(tab.id);
    } catch { /* ignore tabs without URLs */ }
  }

  for (const [domain, tabIds] of Object.entries(byDomain)) {
    if (tabIds.length > 1) {
      const groupId = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(groupId, {
        title: domain.replace('www.', ''),
        color: 'blue'
      });
    }
  }
}
```

## Events

```js
chrome.tabs.onCreated.addListener((tab) => { /* new tab */ });
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { /* tab changed */ });
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => { /* tab closed */ });
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => { /* tab focused */ });
chrome.tabGroups.onUpdated.addListener((group) => { /* group changed */ });
```

## Windows

⚠️ **`chrome.windows` has NO `.query()` method.** Unlike `chrome.tabs.query()`, there is no
`chrome.windows.query()`. Use the correct method for your need:

```js
// ❌ BROKEN
const windows = await chrome.windows.query({ focused: true });
// TypeError: chrome.windows.query is not a function

// ✅ CORRECT
const focused = await chrome.windows.getLastFocused({ populate: true }); // includes tabs array
const current = await chrome.windows.getCurrent({ populate: true });
const all     = await chrome.windows.getAll({ populate: true });
const single  = await chrome.windows.get(windowId, { populate: true });
```

Full API: `getAll`, `getLastFocused`, `getCurrent`, `get(windowId)`, `create`, `update`, `remove`.
Pass `{ populate: true }` to include the `tabs` array on the returned window object.

```js
// Create a new window with specific tabs
const win = await chrome.windows.create({ url: 'https://example.com', focused: true });

// Move current window to a specific position/size
await chrome.windows.update(windowId, { left: 0, top: 0, width: 800, height: 600 });

// Minimise / maximise
await chrome.windows.update(windowId, { state: 'minimized' }); // 'normal' | 'minimized' | 'maximized' | 'fullscreen'
```
