

# Fix Critical Security Vulnerabilities - Step 2: Security Definer Views

## Completed

- Step 1: Password Reset Tokens RLS -- done

## Current Status

After investigation, **6 out of 7 views already have `security_invoker=on`**. Only one view remains with the default security definer behavior:

| View | Status |
|------|--------|
| `ankit_donations_public` | `security_invoker=on` -- already safe |
| `chiaa_gaming_donations_public` | `security_invoker=on` -- already safe |
| `looteriya_gaming_donations_public` | `security_invoker=on` -- already safe |
| `auth_sessions_safe` | `security_invoker=on` -- already safe |
| `user_signups_masked` | `security_invoker=on` -- already safe |
| `user_signups_secure` | `security_invoker=on` -- already safe |
| **`clumsy_god_donations_public`** | **No security_invoker -- VULNERABLE** |

## The Problem

`clumsy_god_donations_public` runs with the view creator's (superuser) permissions, bypassing RLS on `clumsy_god_donations`. Even though the view's WHERE clause filters to approved/success donations, the lack of security invoker means RLS policies are completely ignored.

## Solution

Recreate the `clumsy_god_donations_public` view with `security_invoker = on`, matching the exact same column selection as the current definition.

### Database Migration

```sql
CREATE OR REPLACE VIEW public.clumsy_god_donations_public
WITH (security_invoker = on) AS
SELECT
  id, name, amount, currency, message, message_visible,
  is_hyperemote, voice_message_url, hypersound_url,
  tts_audio_url, created_at
FROM clumsy_god_donations
WHERE moderation_status IN ('approved', 'auto_approved')
  AND payment_status = 'success';
```

### Impact

- The view will now respect RLS policies on `clumsy_god_donations` when queried by anon/authenticated users
- Edge functions using the service role key are unaffected (service role bypasses RLS)
- The leaderboard and public donation display will continue to work because the underlying table already has a SELECT policy allowing anyone to view approved donations

### No Code Changes Required

No frontend or edge function code changes are needed.

---

After this is applied, we move to **Step 3: OBS Token Exposure**.

