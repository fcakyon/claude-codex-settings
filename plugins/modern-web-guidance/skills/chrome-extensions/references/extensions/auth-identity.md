# Authentication with chrome.identity

## Setup

```json
{
  "permissions": ["identity"],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  }
}
```

## Getting an OAuth Token

```js
async function signIn() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}
```

Or with the promise-based API (Chrome 116+):
```js
const { token } = await chrome.identity.getAuthToken({ interactive: true });
```

## Fetching User Profile

```js
async function getUserProfile(token) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
  // Returns: { sub, name, given_name, family_name, picture, email, email_verified }
}
```

## Sign Out

```js
async function signOut(token) {
  // Remove cached token
  await chrome.identity.removeCachedAuthToken({ token });

  // Optionally revoke the token server-side
  await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
}
```

## Error Handling

```js
try {
  const { token } = await chrome.identity.getAuthToken({ interactive: true });
  const profile = await getUserProfile(token);
  displayProfile(profile);
} catch (err) {
  if (err.message.includes('canceled')) {
    showMessage('Sign-in was cancelled');
  } else if (err.message.includes('not granted')) {
    showMessage('Permission was denied');
  } else {
    showMessage('Sign-in failed: ' + err.message);
  }
}
```

## Setting Up Google Cloud Console

1. Go to console.cloud.google.com
2. Create a project (or select existing)
3. Enable "Google People API" or "Google OAuth2 API"
4. Create OAuth 2.0 credentials → Chrome Extension type
5. Set the Application ID to your extension's ID
6. Copy the client_id to your manifest.json

### Extension ID: Development vs Production

**This is critical and often missed.** The OAuth `client_id` is tied to a specific extension ID.
The extension ID changes depending on how you load the extension:

| Context | How ID is determined |
|---------|---------------------|
| Unpacked (development) | Derived from the extension's directory path — changes if you move the folder |
| Packed (.crx) | Derived from the private key used to pack |
| Chrome Web Store | Assigned by the store, permanent |

**To get a stable ID during development**, add a `"key"` field to your manifest.json.
This ensures the same extension ID regardless of directory path:

1. Pack your extension once (`chrome://extensions` → Pack Extension)
2. Open the generated `.crx` as a ZIP, extract the `key` from its manifest
3. Add that key to your development manifest:

```json
{
  "key": "MIIBIjANBgkqhk...your-public-key-here...",
  "manifest_version": 3,
  "name": "My Extension"
}
```

Alternatively, note your unpacked extension's ID from `chrome://extensions` and configure
the OAuth client for that specific ID. Just be aware it will change if the folder moves.

**Always tell users:** "After publishing to the Chrome Web Store, update your OAuth client
configuration with the store-assigned extension ID."

## Non-Google OAuth (launchWebAuthFlow)

For third-party OAuth providers (GitHub, Twitter, etc.):

```js
const redirectUrl = chrome.identity.getRedirectURL();
// Returns: https://<extension-id>.chromiumapp.org/

const authUrl = `https://github.com/login/oauth/authorize?client_id=XXX&redirect_uri=${redirectUrl}`;

const responseUrl = await chrome.identity.launchWebAuthFlow({
  url: authUrl,
  interactive: true
});

// Parse the token from responseUrl
const url = new URL(responseUrl);
const code = url.searchParams.get('code');
```
