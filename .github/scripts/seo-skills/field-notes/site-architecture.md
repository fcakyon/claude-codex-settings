## Checks from live audits

- Fragment routes: Google [generally ignores URL fragments](https://developers.google.com/search/docs/crawling-indexing/url-structure), so client-side routes like `/#/pricing` need real paths through the History API.
- Breadcrumb results: Google shows them [on desktop only](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), so don't expect them in mobile results.
