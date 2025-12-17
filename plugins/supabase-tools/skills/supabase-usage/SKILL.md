---
name: supabase-usage
description: This skill should be used when user asks to "query Supabase", "list Supabase tables", "get Supabase schema", "search Supabase records", or "check Supabase database".
---

# Supabase MCP

Query and explore Supabase databases.

## Available Tools

- `mcp__supabase__list_tables` - List all tables in the database
- `mcp__supabase__get_table_schema` - Get schema for a specific table
- `mcp__supabase__execute_sql` - Run read-only SQL queries

## Best Practices

- Start with `list_tables` to understand database structure
- Use `get_table_schema` before writing queries
- Read-only mode is enabled by default for safety
