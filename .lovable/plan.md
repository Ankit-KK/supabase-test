

# Fix: Nova Plays Dashboard 403 on `get-moderation-queue` + Document in Guide

## Root Cause

The logs confirm: `get-moderation-queue` authenticates successfully (`ankit@hyperchat.site`), finds the `nova_plays` streamer, but then returns **403 Forbidden** at the access check:

```text
const ownsStreamer = userRecord?.streamer_id === streamer.id;
if (!isAdmin && !ownsStreamer) → 403
```

This means the `auth_users` record for `ankit@hyperchat.site` does not have `streamer_id` linked to the `nova_plays` streamer row. **Step 14 was not completed.**

The `get-moderation-queue` function itself needs no code changes — it's dynamic. But two things are needed:

## Changes

### 1. `supabase/functions/moderate-donation/index.ts` — Add `nova_plays_donations` to allowlist (line 254)

`nova_plays_donations` is missing from `ALLOWED_DONATION_TABLES`. Without this, approving/rejecting donations will fail even after the 403 is fixed.

```typescript
'demigod_donations',
'nova_plays_donations',   // ← add
```

### 2. `docs/ADD_NEW_STREAMER.md` — Add two documentation notes

**A) After Step 7 (line 201)**, add a note explaining `get-moderation-queue`:

```markdown
> ℹ️ **`get-moderation-queue`** does NOT need code changes — it dynamically
> constructs the table name from the `streamers` table (Step 2). However, the
> dashboard Moderation tab will return **403 Forbidden** until **Step 14** is
> completed (linking `auth_users.streamer_id` to the streamer's row). Admin
> users bypass this check.
```

**B) In the "Edge Functions That Do NOT Need Changes" table (line 926-941)**, add `get-moderation-queue`:

```markdown
| `get-moderation-queue` | Dynamic table from `streamers`; requires Step 14 account link |
```

**C) In the Quick Checklist (line 968)**, after the post-signup line, add:

```markdown
- [ ] Post-signup: Verify moderation queue loads (403 = Step 14 incomplete)
```

### 3. Immediate fix for the 403

The actual 403 fix is a SQL command (not a code change) — you need to run Step 14 for `nova_plays`:

```sql
UPDATE public.auth_users
SET streamer_id = (SELECT id FROM streamers WHERE streamer_slug = 'nova_plays')
WHERE email = 'ankit@hyperchat.site';
```

## Summary

- 1 edge function edit (`moderate-donation` allowlist)
- 1 doc update (3 small additions to `ADD_NEW_STREAMER.md`)
- 1 SQL command to fix the immediate 403

