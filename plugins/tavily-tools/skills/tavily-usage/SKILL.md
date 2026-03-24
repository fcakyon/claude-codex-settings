---
name: tavily-usage
description: "Search the web and extract content from URLs using Tavily MCP tools. Provides keyword-based web search for discovery and URL content extraction for deep analysis. Use when asked to 'search the web', 'fetch content from URL', 'extract page content', 'scrape this website', 'get information from this link', 'web search for X', or when performing research tasks requiring live web data."
---

# Tavily Search and Extract

Use Tavily MCP tools for web search and content retrieval operations.

## Tool Selection

| Tool | Command | Best For |
|------|---------|----------|
| **Search** | `mcp__tavily__tavily_search` | Keyword queries, finding sources, broad research |
| **Extract** | `mcp__tavily__tavily-extract` | Specific URL content, deep page analysis, structured data |

## Search-then-Extract Workflow

1. Run `mcp__tavily__tavily_search` with your query to discover relevant pages
2. Review search results and identify the most relevant URLs
3. Run `mcp__tavily__tavily-extract` on specific URLs for detailed content
4. Process and synthesize the extracted content for the user

### Example: Researching a Topic

```
# Step 1: Broad search
mcp__tavily__tavily_search("latest Python 3.13 features")

# Step 2: Extract detail from a relevant result
mcp__tavily__tavily-extract("https://docs.python.org/3.13/whatsnew/3.13.html")
```

## Hook Behavior

The `tavily_extract_to_advanced.py` hook automatically upgrades extract calls to advanced mode for better accuracy when needed.

## Environment Variables

Tavily MCP requires `TAVILY_API_KEY` (format: `tvly-...`). Configure in your shell before using the plugin.

## Cost Tips

- Search is cheaper than extract -- use search to filter URLs first
- Only extract URLs that are likely relevant to the task
- Cache results when possible to avoid duplicate API calls
