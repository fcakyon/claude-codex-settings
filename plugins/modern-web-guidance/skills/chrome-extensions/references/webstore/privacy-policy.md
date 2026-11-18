# Privacy Policy Guidance

## When is a Privacy Policy Required?

A privacy policy URL is **required** if your extension:
- Handles personal or sensitive user data (as defined by CWS policies)
- Uses any of these permissions: `identity`, `cookies`, `webRequest`, `browsingData`,
  `history`, `bookmarks`, `topSites`, `<all_urls>` host permission
- Collects any form of analytics or telemetry
- Transmits any data off the user's device

A privacy policy is **recommended** for all extensions, even if no data is collected.
It demonstrates professionalism and can prevent delays if a reviewer flags your extension.

## Where to Host It

The privacy policy must be at a publicly accessible URL. Options:
- **GitHub Pages**: Free, version-controlled. Create a `privacy.md` in a `docs/` branch.
- **GitHub Gist**: Quick and dirty. Create a public gist and link to the raw URL.
- **Project website**: If you have one, add a `/privacy` page.
- **Notion / Google Sites**: Free hosted pages. Stable URLs.

Avoid hosting on a URL that might go down or change. The CWS review team checks the link.

## What to Include

### Minimal Policy (No Data Collection)

If your extension genuinely collects no data, the policy can be short:

```
Privacy Policy for [Extension Name]

Last updated: [Date]

[Extension Name] does not collect, store, or transmit any personal data or
browsing information. All data stays on your device.

This extension does not use cookies, analytics, or third-party services.

If you have questions, contact [email].
```

### Standard Policy (Some Data Collection)

If your extension stores or transmits data, cover these topics:

1. **What data is collected** — Be specific. "User preferences" is not enough.
   Say "Your selected theme preference (light/dark) and saved highlight colors."

2. **How data is stored** — Local storage only? Synced via chrome.storage.sync?
   Sent to a server?

3. **Why data is collected** — Tie each data type to a specific feature.

4. **Third-party services** — If you use any APIs (analytics, auth, etc.), name them
   and link to their privacy policies.

5. **Data sharing** — State whether data is shared with third parties. If yes, with
   whom and why. If no, say so explicitly.

6. **Data retention** — How long is data kept? Can the user delete it?

7. **User controls** — How can users access, export, or delete their data?
   If the extension has a "clear data" button, mention it.

8. **Changes to the policy** — State that you'll update the policy if practices change
   and how users will be notified.

9. **Contact** — Email or URL for privacy questions.

### Template

```
Privacy Policy for [Extension Name]

Last updated: [Date]

## What Data We Collect

[Describe each type of data collected and the feature that requires it.]

## How Data Is Stored

[Describe storage mechanism — local only, synced, or server-side.]

## How Data Is Used

[Describe each use case. Tie to specific features.]

## Third-Party Services

[List any third-party services used. Link to their privacy policies.
If none, state "This extension does not use any third-party services."]

## Data Sharing

[State whether data is shared. If yes, with whom and why.]

## Data Retention and Deletion

[How long data is kept. How users can delete it.]

## Changes to This Policy

[How and when the policy may be updated. How users will be notified.]

## Contact

[Email or support URL for privacy inquiries.]
```

## Common Mistakes

- **Policy doesn't match the data disclosure form**: The CWS data disclosure form and your
  privacy policy must be consistent. If the form says "no data collected" but the policy
  mentions analytics, you'll be rejected.

- **Policy is too vague**: "We may collect some data" is not acceptable. Be specific.

- **Dead link**: If your privacy policy URL returns a 404, the submission is auto-rejected.
  Verify the link before submitting.

- **Missing data types**: If your extension uses `chrome.storage.sync`, that data goes to
  Google's servers — disclose this. If you make any `fetch()` calls, disclose what's sent.

- **No contact information**: The CWS requires a way for users to reach you about privacy
  concerns. Include an email address at minimum.
