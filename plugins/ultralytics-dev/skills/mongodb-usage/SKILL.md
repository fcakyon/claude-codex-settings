---
name: mongodb-usage
description: This skill should be used when user asks to "query MongoDB", "show database collections", "get collection schema", "list MongoDB databases", "search records in MongoDB", or "check database indexes".
---

# MongoDB MCP Usage

Use the MongoDB MCP server to integrate database queries into workflows.

## Read-Only Access

MongoDB MCP is configured in read-only mode. Only queries and data retrieval are supported. No write, update, or delete operations.

## Database Queries

Use `mcp__mongodb__*` tools for:

- Listing databases
- Viewing collection schemas
- Querying collection data
- Analyzing indexes

## Integration Pattern

1. List available databases with `mcp__mongodb__list_databases`
2. Explore collections with `mcp__mongodb__list_collections`
3. Get schema information with `mcp__mongodb__get_collection_schema`
4. Query data as needed for analysis
5. Format results for user consumption

## Environment Variables

MongoDB MCP requires:

- `MONGODB_URI` - Connection string (mongodb://...)

Configure in shell before using the plugin.

## Cost Considerations

- Minimize database calls when possible
- Use schema queries before running analysis queries
- Cache results locally if multiple calls needed
- Prefer aggregation pipelines for complex operations
