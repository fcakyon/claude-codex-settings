## Linking and copy in generated sets

Large sets fail in ways a single page review won't show:

- Related-link orphans: a related block ranked by similarity sends most links to a few popular pages and leaves the long tail with none. Count inbound links per page from the template's real links, and make one slot deterministic, such as the next page in catalog order, so every page has at least one.
- Location-filtered hubs: Googlebot's [default IP addresses are in the US and it sends no `Accept-Language`](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages), so a hub that filters by visitor country shows it only the US subset. Pages outside that subset end up linked only from the sitemap unless a crawl path ignores location, such as related links or an unfiltered index.
- Parent pages: a summary written for one child, such as an episode or a product variant, misdescribes its parent. Write the parent's description from fields aggregated across its children.
- Spam policy names: Google's [spam policies](https://developers.google.com/search/docs/essentials/spam-policies) call the two failures doorway abuse, near-identical pages built for similar queries, and scaled content abuse, many low-value pages made mainly to rank however they were produced. If an LLM writes intros, titles, descriptions, or alt text, Google asks you to [fact check it before publishing](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content), so review a sample from every pattern.
- Hosted sets: a third-party set published on an established domain mainly for that host's ranking signals falls under Google's site reputation policy, and moving a demoted set to a new subdomain or folder counts as circumvention.
- Empty and list fields: when a list is empty, branch the sentence instead of printing a dangling colon, and join lists with `Intl.ListFormat` in the page's locale so they read natively in each language.
