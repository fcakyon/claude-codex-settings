---
name: tavily-usage
description: This skill should be used when user asks to "search the web", "fetch content from URL", "extract page content", "use Tavily search", "scrape this website", "get information from this link", or "web search for X".
---

# Tavily Search and Extract

Use Tavily MCP tools for web search and content retrieval operations.

## Tool Selection

### Tavily Search (`mcp__tavily__tavily_search`)

Use for:

- Keyword-based searches across the web
- Finding relevant pages and content
- Quick answer gathering
- Multiple result discovery

**Best for**: Initial research, finding sources, broad queries

### Tavily Extract (`mcp__tavily__tavily-extract`)

Use for:

- Getting detailed content from specific URLs
- Deep analysis of page content
- Structured data extraction
- Following up on search results

**Best for**: In-depth analysis, specific URL content, detailed information

## Hook Behavior

`tavily_extract_to_advanced.py` hook automatically upgrades extract calls to advanced mode for better accuracy when needed.

## Integration Pattern

1. Use `mcp__tavily__tavily_search` for discovery phase
2. Analyze results to find relevant URLs
3. Use `mcp__tavily__tavily-extract` for detailed content on specific URLs
4. Process extracted content for user needs

## Environment Variables

Tavily MCP requires:

- `TAVILY_API_KEY` - API key from Tavily (tvly-...)

Configure in shell before using the plugin.

## Cost Considerations

- Search is cheaper than extract
- Use search to filter relevant URLs first
- Only extract URLs that are likely relevant
- Cache results when possible
