# Table Relationships

## Foreign Key Setup

```sql
-- One-to-many: user has many posts
create table posts (
  id serial primary key,
  user_id uuid references auth.users on delete cascade,
  title text,
  content text
);

-- Many-to-many: posts have many tags
create table tags (
  id serial primary key,
  name text unique
);

create table post_tags (
  post_id int references posts on delete cascade,
  tag_id int references tags on delete cascade,
  primary key (post_id, tag_id)
);
```

## Querying Relationships (JavaScript)

Supabase auto-detects relationships from foreign keys:

```javascript
// One-to-many: get posts with author
const { data: posts } = await supabase.from("posts").select(`
    id, title, content,
    author:users!user_id(id, email, full_name)
  `);

// Nested relations: posts with author and comments
const { data: posts } = await supabase.from("posts").select(`
    id, title,
    author:users!user_id(id, email),
    comments(id, content, user:users(email))
  `);

// Many-to-many: posts with tags
const { data: posts } = await supabase.from("posts").select(`
    id, title,
    tags:post_tags(tag:tags(name))
  `);

// Specify foreign key with !hint when ambiguous
const { data } = await supabase.from("messages").select(`
    sender:users!sender_id(name),
    receiver:users!receiver_id(name)
  `);
```

## Querying Relationships (Python)

```python
# One-to-many with nested select
response = supabase.table("posts").select("id, title, author:users!user_id(id, email)").execute()

# Multiple nested relations
response = supabase.table("posts").select("id, title, comments(id, content, user:users(email))").execute()

# Many-to-many through junction table
response = supabase.table("posts").select("id, title, tags:post_tags(tag:tags(name))").execute()
```
