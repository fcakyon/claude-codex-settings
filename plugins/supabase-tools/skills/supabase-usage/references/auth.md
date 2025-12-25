# Supabase Authentication

Supabase Auth provides user management with JWT-based sessions.

## Auth Tables

Key tables in the `auth` schema:

- `auth.users` - User accounts (id, email, phone, created_at, etc.)
- `auth.sessions` - Active sessions
- `auth.identities` - OAuth provider identities

## JavaScript SDK

```javascript
// Initialize client
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, anonKey);

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "securepassword",
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "securepassword",
});

// Get current user
const {
  data: { user },
} = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth event:", event);
  if (session) console.log("User ID:", session.user.id);
});

// OAuth sign in
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
});
```

## Python SDK

```python
from supabase import Client, create_client

supabase: Client = create_client(url, key)

# Sign up
response = supabase.auth.sign_up({"email": "user@example.com", "password": "securepassword"})

# Sign in
response = supabase.auth.sign_in_with_password({"email": "user@example.com", "password": "securepassword"})

# Get current user
user = supabase.auth.get_user()

# Sign out
supabase.auth.sign_out()
```

## User Profile Table Pattern

Link a public profile table to auth.users:

```sql
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  first_name text,
  last_name text,
  avatar_url text,
  primary key (id)
);

alter table public.profiles enable row level security;

-- Auto-create profile on signup (trigger)
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
