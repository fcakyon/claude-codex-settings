# Query Patterns

## Filtering

**JavaScript:**

```javascript
// Equality
const { data } = await supabase
  .from("users")
  .select("*")
  .eq("status", "active");

// Comparison
const { data } = await supabase
  .from("users")
  .select("*")
  .gte("age", 18)
  .lt("age", 65);

// Pattern matching
const { data } = await supabase
  .from("users")
  .select("*")
  .ilike("name", "%john%");

// IN operator
const { data } = await supabase
  .from("users")
  .select("*")
  .in("role", ["admin", "moderator"]);

// OR conditions
const { data } = await supabase
  .from("posts")
  .select("*")
  .or("status.eq.featured,priority.gte.5");

// NOT
const { data } = await supabase
  .from("users")
  .select("*")
  .not("status", "eq", "banned");

// NULL check
const { data } = await supabase
  .from("users")
  .select("*")
  .is("deleted_at", null);

// Array contains
const { data } = await supabase
  .from("posts")
  .select("*")
  .contains("tags", ["javascript"]);

// Full-text search
const { data } = await supabase
  .from("posts")
  .select("*")
  .textSearch("content", "supabase & database");
```

**Python:**

```python
# Equality
response = supabase.table("users").select("*").eq("status", "active").execute()

# Comparison
response = supabase.table("users").select("*").gte("age", 18).lt("age", 65).execute()

# Pattern matching (case-insensitive)
response = supabase.table("users").select("*").ilike("name", "%john%").execute()

# IN operator
response = supabase.table("users").select("*").in_("role", ["admin", "moderator"]).execute()

# OR conditions
response = supabase.table("posts").select("*").or_("status.eq.featured,priority.gte.5").execute()

# NOT
response = supabase.table("users").select("*").neq("status", "banned").execute()

# NULL check
response = supabase.table("users").select("*").is_("deleted_at", "null").execute()
```

## Pagination

**Offset-based (simple, less efficient for large datasets):**

```javascript
// JavaScript
const { data } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false })
  .range(0, 9); // rows 0-9 (first 10)

// Next page
const { data } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false })
  .range(10, 19);
```

```python
# Python
response = supabase.table("posts").select("*").order("created_at", desc=True).range(0, 9).execute()
```

**Cursor-based (efficient for large datasets):**

```javascript
// JavaScript - use last item's id/timestamp as cursor
const { data } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false })
  .lt("created_at", lastTimestamp)
  .limit(10);
```

```python
# Python
response = (
    supabase.table("posts")
    .select("*")
    .order("created_at", desc=True)
    .lt("created_at", last_timestamp)
    .limit(10)
    .execute()
)
```

## Counting Rows

```javascript
// JavaScript - exact count
const { count } = await supabase
  .from("users")
  .select("*", { count: "exact", head: true })
  .eq("status", "active");

console.log(`Active users: ${count}`);
```

```python
# Python
response = supabase.table("users").select("*", count="exact", head=True).eq("status", "active").execute()

print(f"Active users: {response.count}")
```

## Index Recommendations

Add indexes for frequently filtered/sorted columns:

```sql
-- Single column index
create index idx_posts_status on posts (status);

-- Composite index for common filter combinations
create index idx_posts_user_status on posts (user_id, status);

-- Partial index for specific conditions
create index idx_active_posts on posts (created_at) where status = 'active';

-- Use index_advisor for recommendations
select * from index_advisor('SELECT * FROM posts WHERE status = ''active'' ORDER BY created_at');
```

## Query Performance Analysis

```sql
-- Analyze query execution plan
explain analyze select * from posts where status = 'active' order by created_at limit 10;
```
