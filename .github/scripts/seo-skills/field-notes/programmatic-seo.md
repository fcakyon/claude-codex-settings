## Linking and copy in generated sets

Large sets fail in ways a single page review won't show:

- Related-link orphans: a related block ranked by similarity sends most links to a few popular pages and leaves the long tail with none. Count inbound links per page from the template's real links, and make one slot deterministic, such as the next page in catalog order, so every page has at least one.
- Location-filtered hubs: Googlebot's [default IP addresses are in the US and it sends no `Accept-Language`](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages), so a hub that filters by visitor country shows it only the US subset. Pages outside that subset end up linked only from the sitemap unless a crawl path ignores location, such as related links or an unfiltered index.
- Parent pages: a summary written for one child, such as an episode or a product variant, misdescribes its parent. Write the parent's description from fields aggregated across its children.
- Empty and list fields: when a list is empty, branch the sentence instead of printing a dangling colon, and join lists with `Intl.ListFormat` in the page's locale so they read natively in each language.
