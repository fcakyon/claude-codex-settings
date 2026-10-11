---
name: paper-search-usage
description: This skill should be used when the user asks to "search for papers", "find research papers", "search arXiv", "search PubMed", "look up a DOI", "download a paper", "search IEEE", or "search Scopus".
---

# Search and read papers

Run [Paper Search CLI](https://github.com/fcakyon/paper-search-cli) through the shell. If `paper-search` is unavailable, follow [setup](../setup/SKILL.md).

## Find papers

```bash
paper-search search 'object detection' -s fast -n 5
paper-search search 'object detection' -s arxiv,crossref -n 5
paper-search sources
```

Search returns JSON. Check `errors` for partial failures and retain source identifiers and URLs. Try alternate terms and multiple sources before concluding that no papers exist. Discover source names with `paper-search sources`; use explicit `-s ieee`, `-s scopus`, or `-s wos` only with configured credentials.

## Look up, download, and read

```bash
paper-search tool get_crossref_paper_by_doi 10.1038/nature12373
paper-search download arxiv 1706.03762 -o ./downloads
paper-search read arxiv 1706.03762 -o ./downloads
paper-search tool get_citing_papers 10.1038/nature12373
paper-search tool get_referenced_papers 10.1038/nature12373
```

Citation commands accept a DOI or OpenAlex work ID, not a title. Check pagination and truncation metadata before treating a citation list as complete. Use `paper-search tool --help` and `paper-search tool <operation> --help` to discover other operations and their arguments.

Verify author names, venue, and year against the published paper or official record. For numerical claims, inspect the PDF's actual table or figure; extracted text can lose layout. Do not treat a search snippet as evidence for a result.
