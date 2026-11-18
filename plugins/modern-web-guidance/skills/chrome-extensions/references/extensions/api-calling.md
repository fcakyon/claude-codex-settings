# Calling External APIs from Extensions

## Permissions

Ordinarily, fetch requests made by extensions follow normal CORS rules.

To determine if this is sufficient, use `curl` to call the API with a test origin. For example:

```
curl -H "Origin: https://example.com" -I https://api.openweathermap.org/data/2.5/weather?q=London&appid=KEY`
```

If the response includes either `*` or `https://example.com` as the value for the `Access-Control-Allow-Origin` header, the API supports CORS.

If the API does not support CORS, request host permissions to bypass these restrictions:

```json
{
  "host_permissions": [
    "https://no-cors-api.example.com/*"
  ]
}
```

**Do NOT use `<all_urls>` just for API calls.** Scope to the specific API domains.

## Where to Make API Calls

API calls work from any extension context (service worker, popup, side panel, content scripts):

```js
// From popup or service worker
const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=London&appid=KEY');
const data = await response.json();
```

**Content scripts** can also make fetch calls, but they follow the web page's CORS rules.

## Error Handling Pattern

```js
async function callAPI(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    if (err instanceof TypeError) {
      // Network error (offline, DNS failure, etc.)
      console.error('Network error:', err.message);
    } else {
      console.error('API error:', err.message);
    }
    return null;
  }
}
```

## API Keys

- Never hardcode API keys in published extensions
- Use `chrome.storage.local` for user-provided keys
- For your own backend, use `chrome.identity` to authenticate instead of embedding keys
- Mark placeholder keys clearly: `const API_KEY = 'YOUR_API_KEY_HERE';`

## Service Worker Considerations

If making API calls from the service worker, remember it can terminate. For long-polling or
webhook-style patterns, use `chrome.offscreen` to create an offscreen document that stays alive,
or use `chrome.alarms` for periodic polling.
