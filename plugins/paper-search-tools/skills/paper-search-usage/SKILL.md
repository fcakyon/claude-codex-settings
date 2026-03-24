---
name: paper-search-usage
description: "Search academic papers across arXiv, PubMed, IEEE Xplore, Scopus, ACM Digital Library, and Semantic Scholar using MCP tools. Use when the user asks to search for papers, find research papers, search arXiv, search PubMed, find academic papers, search IEEE, search Scopus, or look up scientific literature."
---

# Paper Search MCP

Search academic papers across multiple platforms using `mcp__paper-search__*` tools.

## Workflow

1. **Identify the search scope** — determine which platforms match the user's domain:
   - arXiv: preprints in physics, math, CS
   - PubMed: biomedical and life sciences
   - IEEE Xplore: engineering and electronics
   - Scopus: multidisciplinary research
   - ACM Digital Library: computer science
   - Semantic Scholar: AI-powered cross-domain search

2. **Run the search** — call the appropriate MCP tool with keywords, authors, or topics:
   ```
   mcp__paper-search__search_arxiv(query="transformer attention mechanisms", max_results=10)
   mcp__paper-search__search_pubmed(query="CRISPR gene therapy", max_results=10)
   mcp__paper-search__search_semantic_scholar(query="reinforcement learning robotics")
   ```

3. **Refine results** — start broad, then narrow with specific terms, date ranges, or author filters.

4. **Cross-reference sources** — for literature reviews, query multiple platforms and deduplicate results by title or DOI.

## Best Practices

- Use platform-specific searches for domain-specific papers (e.g., PubMed for biomedical, IEEE for engineering)
- Combine Semantic Scholar with domain-specific platforms for better coverage
- Present results with title, authors, year, and abstract summary
