---
name: email-design
description: This skill should be used when user asks to "design app emails", "theme transactional emails", "fix verification emails", "build email templates", or "review password reset emails". Match an app’s brand and reuse its delivery pipeline across account, billing and notification emails.
---

# App email design

Make the email help someone finish the action they started in the app. Preserve the app’s transport, authentication and consent rules. Use this skill for transactional email design and integration, rather than email service setup or campaign sending.

## Inspect before changing

Trace each requested event from the app action to its template and sending client. Check locales, HTML and text parts, provider-managed templates, sender, reply address, expiry and destination handling. Keep tokens, addresses and captured messages private. Find the shared layout before adding another renderer. Do not replace a working delivery service to change its design.

Read the app’s visible theme and copy. Choose brand name, approved logo, page and surface backgrounds, body and muted text, primary action and its text color, font stack, corner radius and support address. Put these in one theme or layout, with message wording separate. Keep per-message content limited to subject, preview, heading, body, code or primary action, and necessary context. Use the app’s locale and runtime formatting for amounts and dates.

## Design around the action

- Verification: show the code as selectable text, say where to enter it, and state the real expiry. Keep the code out of the subject and hidden preview. Do not make a link that only opens an unrelated homepage.
- Password reset: continue the app’s actual recovery flow. Do not invent links, token lifetimes or automatic sign-in. Say what to do if the recipient did not request it.
- Billing: show the amount, currency, period, renewal or cancellation date when relevant. Link to the exact plan or receipt. Do not shorten away billing terms or add upgrade pressure to a receipt.
- Notifications: name the event and link to the affected item. Include preferences where supported. Keep marketing consent separate from required account messages.

Use one main action. A code-entry email needs a readable code, rather than a competing button. Write direct headings such as “Verify your email” and “Reset your password”. Cut greetings, registration ceremony, congratulations and technical pipeline details when they do not help the next step.

Remove accent rules, colored top edges and similar lines added only as decoration. Keep useful card surfaces, rounded corners, code highlights, brand color and spacing. Make the requested cleanup without flattening the surrounding design.

## Build for email readers

Adapt [the layout asset](assets/email.html) to the app’s existing template engine. Its placeholder names describe content slots, not a required runtime. When the backend already wraps messages in its own document, as PocketBase does for auth emails, send only the asset's head tags and body content, and reset the wrapper's body padding and background. Replace its example theme with the app’s tokens. Keep action or code sections only when needed. Use the server’s escaping template engine for all dynamic text and validate action destinations where they are created. Never accept raw HTML from form fields or interpolate account data into markup.

Use a fluid single column up to 560 px, presentation tables and inline CSS for essential layout. Include explicit foreground and background colors. Keep the light theme inline and put dark colors only in the asset's `prefers-color-scheme: dark` block. Keep its `color-scheme` meta tags and `:root` rule too: without them Apple Mail recolors the light theme itself and can leave dark text on a dark card. Keep the `x-apple-data-detectors` rule so Apple Mail does not underline codes, dates and addresses as links. Treat rounded corners as decoration. Use system font fallbacks, readable body text, large tap targets and underlined text links. Images need absolute HTTPS URLs and useful alt text. Keep the message usable with remote images blocked, styles stripped or a screen reader. Use semantic headings and a logical reading order. Do not depend on JavaScript, web fonts, flexbox, SVG or background images for essential content.

Send a matching plain-text part with the same action, code, expiry and required context. Keep secrets out of tracking URLs and do not add open tracking to account emails by default. Reuse verified sender and reply settings. Do not change DNS or delivery credentials as part of visual work.

## Verify the finished output

Render the actual sending template with synthetic data in every changed locale. Inspect desktop and narrow screenshots, a long address or title, images blocked, and both HTML and text output. Check escaping with literal markup in user-supplied fields, action destinations, the issued code, and the real expiry against the owning backend. Exercise the real event against a local mail capture or an authorized test inbox. Preserve the selected app action through verification and recovery.

A browser screenshot proves the template layout in that browser. Report actual inbox rendering and delivered mail separately, with the clients tested. Never claim Gmail, Apple Mail or Outlook compatibility from a browser preview alone. Do not send to real recipients, publish templates or change production pipelines without task authorization. Keep only requested previews and remove task captures containing real addresses or codes.

References for rendering decisions: [HTML email structure](https://mailchimp.com/help/about-html-email) and [accessible email content](https://mailchimp.com/help/accessibility-in-email-marketing).
