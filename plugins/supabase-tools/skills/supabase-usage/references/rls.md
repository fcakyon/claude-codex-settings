# Row Level Security (RLS)

RLS controls data access at the row level based on the authenticated user.

## Enabling RLS

```sql
alter table public.posts enable row level security;
```

## Policy Types

| Operation | Clause                 | Purpose                          |
| --------- | ---------------------- | -------------------------------- |
| SELECT    | `using`                | Filter which rows can be read    |
| INSERT    | `with check`           | Validate new rows                |
| UPDATE    | `using` + `with check` | Filter + validate                |
| DELETE    | `using`                | Filter which rows can be deleted |

## Common Policy Patterns

**1. User owns row:**

```sql
create policy "Users can view own data" on profiles
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can update own data" on profiles
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );
```

**2. Public read, owner write:**

```sql
create policy "Public read" on posts
for select using (true);

create policy "Owner can modify" on posts
for all to authenticated
using ( (select auth.uid()) = author_id );
```

**3. Team/organization access:**

```sql
create policy "Team members can view" on documents
to authenticated
using (
  team_id in (
    select team_id from team_members
    where user_id = (select auth.uid())
  )
);
```

**4. Role-based access:**

```sql
create policy "Admins can do anything" on posts
to authenticated
using (
  exists (
    select 1 from users
    where id = (select auth.uid()) and role = 'admin'
  )
);
```

## RLS Performance Tips

**Always use `(select auth.uid())` instead of `auth.uid()`:**

```sql
-- SLOW (recalculates per row)
using ( auth.uid() = user_id )

-- FAST (calculates once, 99%+ improvement)
using ( (select auth.uid()) = user_id )
```

**Add indexes on RLS columns:**

```sql
create index idx_posts_user_id on posts using btree (user_id);
create index idx_documents_team_id on documents using btree (team_id);
```

**Specify roles with `TO`:**

```sql
-- Good: policy only applies to authenticated users
create policy "..." on posts to authenticated using (...);

-- Bad: policy applies to all roles including anon
create policy "..." on posts using (...);
```

## Viewing Policies

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename = 'your_table';
```
