---
name: supabase-usage
description: This skill should be used when user asks to "query Supabase", "list Supabase tables", "get Supabase schema", "search Supabase records", "check Supabase database", "Supabase auth", "Supabase authentication", "RLS policy", "row level security", "Supabase foreign key", "table relationships", "Supabase join", "Supabase filter", "Supabase pagination", or needs guidance on Supabase database patterns, auth flows, RLS policies, or query best practices.
---

# Supabase Database Patterns

Patterns for working with Supabase databases including Auth, Row Level Security, table relationships, and query best practices.

## Overview

- **MCP Tools**: Query and explore database structure
- **Authentication**: User management, sessions, auth tables
- **Row Level Security**: Policy patterns for data access control
- **Table Relationships**: Foreign keys, joins, nested queries
- **Query Patterns**: Filtering, pagination, performance

## MCP Tools

Available tools for database exploration:

- `mcp__supabase__list_tables` - List all tables in the database
- `mcp__supabase__get_table_schema` - Get schema for a specific table
- `mcp__supabase__execute_sql` - Run read-only SQL queries

**Workflow:**

1. Start with `list_tables` to understand database structure
2. Use `get_table_schema` to inspect columns and types
3. Use `execute_sql` for custom queries (read-only)

---

## Best Practices

### DO

- ✓ Enable RLS on all public tables
- ✓ Use `(select auth.uid())` in RLS policies for performance
- ✓ Add indexes on RLS-checked columns
- ✓ Specify roles with `TO authenticated` in policies
- ✓ Use `on delete cascade` for foreign keys to auth.users
- ✓ Use cursor-based pagination for large datasets
- ✓ Select only needed columns: `.select('id, name')` not `.select('*')`

### DON'T

- ✗ Store sensitive data without RLS
- ✗ Use `auth.uid()` directly in policies (use `(select auth.uid())`)
- ✗ Create policies without specifying roles
- ✗ Forget indexes on frequently filtered columns
- ✗ Use offset pagination for deep pages (>1000 rows)
- ✗ Expose auth.users directly via API (use public profiles table)

---

## Quick Reference

### Common Filters

| Filter           | JavaScript               | Python                   |
| ---------------- | ------------------------ | ------------------------ |
| Equals           | `.eq('col', val)`        | `.eq("col", val)`        |
| Not equals       | `.neq('col', val)`       | `.neq("col", val)`       |
| Greater than     | `.gt('col', val)`        | `.gt("col", val)`        |
| Greater or equal | `.gte('col', val)`       | `.gte("col", val)`       |
| Less than        | `.lt('col', val)`        | `.lt("col", val)`        |
| Less or equal    | `.lte('col', val)`       | `.lte("col", val)`       |
| Pattern match    | `.ilike('col', '%val%')` | `.ilike("col", "%val%")` |
| In list          | `.in('col', [a,b])`      | `.in_("col", [a,b])`     |
| Is null          | `.is('col', null)`       | `.is_("col", "null")`    |
| OR               | `.or('a.eq.1,b.eq.2')`   | `.or_("a.eq.1,b.eq.2")`  |

### Auth Tables Quick Reference

| Table             | Key Columns                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `auth.users`      | id, email, phone, created_at, last_sign_in_at, raw_user_meta_data |
| `auth.sessions`   | id, user_id, created_at, updated_at                               |
| `auth.identities` | id, user_id, provider, identity_data                              |

### RLS Policy Template

```sql
create policy "policy_name" on table_name
to authenticated  -- or anon, or specific role
for select        -- select, insert, update, delete, or all
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );  -- for insert/update
```

---

## Additional Resources

For detailed patterns and code examples, consult:

- **`references/auth.md`** - Authentication with JS/Python SDK, user profiles
- **`references/rls.md`** - Row Level Security policies and performance tips
- **`references/relationships.md`** - Table relationships and nested queries
- **`references/query-patterns.md`** - Filtering, pagination, counting, indexes
