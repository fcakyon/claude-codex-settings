---
name: tawk-support
description: This skill should be used when the user asks to "add Tawk support chat", "identify chat visitors", "theme a support widget", or "set up a Tawk knowledge base". Reuse signed account identification, product-specific knowledge and website styling without sharing credentials or private app content.
---

# Tawk support

Inspect the product’s existing support widget, account/session owner, locales, theme and real user journeys. Reuse its verified account lookup and delivery process. Keep each product’s Tawk property and signing keys separate.

Read [integration](references/integration.md) before adapting [TawkSupport.tsx](assets/TawkSupport.tsx). The React 19.2+ asset owns SDK identity refresh, account switching, signed guests, cancellation and visibility. The host owns loading Tawk once, widget/language switching, the verified server endpoint and observable auth changes. Other stacks should implement the same contract.

Read [knowledge and theme](references/knowledge-and-theme.md) when configuring the property. Ground answers in current product source and live flows, maintain a tracked source, and test actual bot answers and links. Product facts from one app are not defaults for another.

Verify the app build and applicable account, locale, guest/logout, visibility and browser journeys before release. Keep fixture, real SDK and deployed evidence distinct. Never treat passing extraction tests or this recipe as authorization to publish another app. Record the app revision and evidence in existing tracked guidance.
