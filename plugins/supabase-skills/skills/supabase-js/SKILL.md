---
name: supabase-js
description: This skill should be used when user asks to "use supabase-js", "query Supabase database", "supabase auth", "supabase storage", "supabase realtime", "supabase edge functions", or works with the @supabase/supabase-js JavaScript/TypeScript SDK.
references:
  - supabase-js
  - auth-js
  - postgrest-js
  - storage-js
license: MIT
---

# Supabase JavaScript SDK Skill

Skill for building applications with the `@supabase/supabase-js` SDK. Covers Auth, Database (PostgREST), Storage, Realtime, and Edge Functions.

The SDK docs at https://supabase.com/docs/reference/javascript are the source of truth. The reference files alongside this skill contain source code and READMEs extracted from the monorepo for quick lookup.

## Setup

```bash
npm install @supabase/supabase-js
```

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
```

For type-safe queries, generate types from your database schema:

```bash
supabase gen types typescript --project-id your-project-id > database.types.ts
```

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
```

## Quick Decision Trees

### "I need to query data"

```
Database query?
├─ Select rows → supabase.from('table').select('*')
├─ Filter rows → .select().eq('col', val) / .gt() / .lt() / .in() / .like()
├─ Join tables → .select('*, other_table(*)') or .select('*, other_table!fk(*)')
├─ Insert → supabase.from('table').insert({ col: val })
├─ Upsert → supabase.from('table').upsert({ id: 1, col: val })
├─ Update → supabase.from('table').update({ col: val }).eq('id', 1)
├─ Delete → supabase.from('table').delete().eq('id', 1)
├─ Call RPC function → supabase.rpc('function_name', { arg: val })
├─ Count rows → .select('*', { count: 'exact', head: true })
├─ Pagination → .range(0, 9) or .limit(10).offset(20)
└─ Order → .order('created_at', { ascending: false })
```

### "I need authentication"

```
Auth?
├─ Email/password sign up → supabase.auth.signUp({ email, password })
├─ Email/password sign in → supabase.auth.signInWithPassword({ email, password })
├─ OAuth (Google, GitHub, etc.) → supabase.auth.signInWithOAuth({ provider: 'google' })
├─ Magic link → supabase.auth.signInWithOtp({ email })
├─ Phone OTP → supabase.auth.signInWithOtp({ phone })
├─ Sign out → supabase.auth.signOut()
├─ Get current user → supabase.auth.getUser()
├─ Get session → supabase.auth.getSession()
├─ Listen to auth changes → supabase.auth.onAuthStateChange((event, session) => {})
├─ Reset password → supabase.auth.resetPasswordForEmail(email)
├─ Update user → supabase.auth.updateUser({ data: { name: 'New' } })
└─ Admin operations → supabase.auth.admin.listUsers() / .deleteUser(id)
```

### "I need file storage"

```
Storage?
├─ Upload file → supabase.storage.from('bucket').upload('path/file.png', file)
├─ Download file → supabase.storage.from('bucket').download('path/file.png')
├─ Get public URL → supabase.storage.from('bucket').getPublicUrl('path/file.png')
├─ Create signed URL → supabase.storage.from('bucket').createSignedUrl('path', 3600)
├─ List files → supabase.storage.from('bucket').list('folder')
├─ Move file → supabase.storage.from('bucket').move('old/path', 'new/path')
├─ Remove file → supabase.storage.from('bucket').remove(['path/file.png'])
├─ Create bucket → supabase.storage.createBucket('name', { public: false })
└─ List buckets → supabase.storage.listBuckets()
```

### "I need realtime"

```
Realtime?
├─ Listen to DB changes → supabase.channel('name')
│    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handler)
│    .subscribe()
├─ Broadcast messages → channel.send({ type: 'broadcast', event: 'cursor', payload: { x, y } })
├─ Listen to broadcasts → .on('broadcast', { event: 'cursor' }, handler)
├─ Presence (who's online) → channel.track({ user_id, online_at })
│    .on('presence', { event: 'sync' }, () => channel.presenceState())
├─ Unsubscribe → supabase.removeChannel(channel)
└─ Unsubscribe all → supabase.removeAllChannels()
```

### "I need edge functions"

```
Edge Functions?
├─ Invoke function → supabase.functions.invoke('function-name', { body: { key: 'val' } })
├─ With custom headers → .invoke('fn', { headers: { 'x-custom': 'val' }, body })
└─ Set region → .invoke('fn', { body, region: 'us-east-1' })
```

## Common Patterns

### Server-side with service role key

```typescript
// Server-side only - bypasses RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})
```

### React/Next.js auth

```typescript
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function useUser() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])
  return user
}
```

### Typed database queries

```typescript
// Generated types give autocomplete for table names, column names, and return types
const { data, error } = await supabase
  .from('profiles')        // autocompleted table name
  .select('id, username')  // autocompleted columns
  .eq('id', userId)        // type-safe filter
  .single()                // returns single row or error
// data is typed as { id: string; username: string } | null
```

## Package Index

| Package | Sub-client | Reference |
|---------|-----------|-----------|
| `@supabase/supabase-js` | `createClient()` | `references/supabase-js/` |
| `@supabase/auth-js` | `.auth` | `references/auth-js/` |
| `@supabase/postgrest-js` | `.from()`, `.rpc()` | `references/postgrest-js/` |
| `@supabase/realtime-js` | `.channel()`, `.realtime` | `references/realtime-js/` |
| `@supabase/storage-js` | `.storage` | `references/storage-js/` |
| `@supabase/functions-js` | `.functions` | `references/functions-js/` |
