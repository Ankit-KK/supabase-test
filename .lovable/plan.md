

# Fix: update-streamer-settings 401 Unauthorized

## Root Cause

The `update-streamer-settings` edge function authenticates using `supabase.auth.getUser(token)`, which expects a Supabase JWT. However, the app uses a custom authentication system with the `auth_users` table, so the token stored in `localStorage` is a custom session token -- not a Supabase JWT. This always fails with 401.

Additionally, the frontend (`ModerationPanel.tsx`) does not include the `authToken` in the request body.

## Fix

Two changes needed:

### 1. Frontend: Pass authToken in the request body

**File: `src/components/dashboard/moderation/ModerationPanel.tsx`** (line ~218)

Add `authToken` from `localStorage` to the request body, matching the pattern used by `moderate-donation`.

```
Before:  body: { streamerId, setting: key, value }
After:   body: { streamerId, setting: key, value, authToken: localStorage.getItem('auth_token') }
```

### 2. Edge Function: Switch to custom auth with admin bypass

**File: `supabase/functions/update-streamer-settings/index.ts`**

Replace the Supabase JWT authentication (lines 19-41) with:
- Extract `authToken` from request body
- Validate using `validate_session_token` RPC (same as `manage-telegram-user`)
- Add admin bypass: if user doesn't own the streamer, check `admin_emails` table
- Add `x-auth-token` to CORS allowed headers

This brings the function in line with the established authorization standard used by `manage-telegram-user`, `moderate-donation`, and `get-moderation-queue`.

No other files or edge functions are affected.

