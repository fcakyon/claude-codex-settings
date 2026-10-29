## Rich result limits and entity identity

These rules decide whether markup is safe and whether it can earn anything:

- FAQ rich results: since August 2023, Google [shows them only for well-known government and health sites](https://developers.google.com/search/blog/2023/08/howto-faq-changes), and unused markup has no visible effect in Search. Keep `FAQPage` where the questions are visible on the page, and don't promise the rich result.
- Ratings from other sites: Google's review snippet guidelines say [don't aggregate reviews or ratings from other websites](https://developers.google.com/search/docs/appearance/structured-data/review-snippet), so IMDb, Rotten Tomatoes, or app store scores never go into `aggregateRating`. Show them as attributed text instead.
- Organization logo: Google [may show the logo on a purely white background](https://developers.google.com/search/docs/appearance/structured-data/logo), where a white or light-gray wordmark vanishes. Point `logo` at a version that reads on white, at least 112x112 px, at a crawlable URL.
- Entity identity: schema.org defines [`sameAs`](https://schema.org/sameAs) as a page that unambiguously identifies the item, such as its Wikipedia page, Wikidata entry, or official website. On a movie or show page, the IMDb title URL does the same job and tells apart remakes that share a name.
