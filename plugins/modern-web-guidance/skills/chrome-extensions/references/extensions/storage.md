# Chrome Storage API

## Storage Areas

| Area | Persists | Syncs | Quota | Use For |
|------|----------|-------|-------|---------|
| `chrome.storage.local` | Yes | No | 10 MB | Most extension data |
| `chrome.storage.sync` | Yes | Yes (across devices) | 100 KB total, 8 KB/item | User preferences, small data |
| `chrome.storage.session` | Until browser close | No | 10 MB | Ephemeral state, survives SW restart |

Permission required: `"storage"`

## Basic Operations

```js
// Set
await chrome.storage.local.set({ key: 'value', count: 42, items: [1,2,3] });

// Get (with defaults)
const { key = 'default', count = 0 } = await chrome.storage.local.get(['key', 'count']);

// Get all
const allData = await chrome.storage.local.get(null);

// Remove
await chrome.storage.local.remove('key');
await chrome.storage.local.remove(['key1', 'key2']);

// Clear all
await chrome.storage.local.clear();
```

## Change Listener (Works Across All Contexts)

```js
chrome.storage.onChanged.addListener((changes, areaName) => {
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(`${areaName}.${key}: ${oldValue} → ${newValue}`);
  }
});
```

## storage.sync Quotas

Be aware of limits when using sync:
- `QUOTA_BYTES_PER_ITEM`: 8,192 bytes per key-value pair
- `MAX_ITEMS`: 512 items
- `QUOTA_BYTES`: 102,400 bytes total
- `MAX_WRITE_OPERATIONS_PER_HOUR`: 1,800
- `MAX_WRITE_OPERATIONS_PER_MINUTE`: 120

For large data, split across multiple keys or use `chrome.storage.local`.

## storage.session Notes

- Only available in MV3
- Cleared when the browser closes (not just when SW terminates)
- Accessible from service worker, popup, side panel, etc.
- Good for: auth tokens, temporary caches, in-progress operations

## Why Not localStorage?

`localStorage` works in popup and extension pages but NOT in service workers.
`chrome.storage` works everywhere and supports the cross-context change listener.
Always prefer `chrome.storage`.
