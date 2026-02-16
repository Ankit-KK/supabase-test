

# Fix 401 Error When Adding Moderators

## Root Cause
The `ModeratorManager` component calls `supabase.from('streamers_moderators').insert(...)` directly using the anon key. However, the RLS policies on `streamers_moderators` require either Supabase Auth (`auth.email()`) or `service_role` access. Since this project uses a **custom auth system** (tokens in `localStorage`), `auth.email()` is always null, and the anon client is blocked.

## Solution
Create a new edge function `manage-moderators` that handles add/remove/list operations using the service role key, with custom auth token validation -- matching the pattern used by other dashboard operations (e.g., `moderate-donation`, `update-streamer-settings`).

## Changes

### 1. New Edge Function: `supabase/functions/manage-moderators/index.ts`
- Accepts actions: `list`, `add`, `remove`
- Validates the custom auth token via `validate_session_token` RPC
- Verifies ownership (streamer's `user_id` matches the authenticated user) with admin bypass
- Uses service role client for database operations
- Follows the exact same pattern as `update-streamer-settings`

### 2. Update `src/components/dashboard/ModeratorManager.tsx`
- Replace all 3 direct Supabase calls with edge function invocations:
  - `fetchModerators` -> `supabase.functions.invoke('manage-moderators', { body: { action: 'list', streamerId }, headers: { 'x-auth-token': authToken } })`
  - `addModerator` -> `supabase.functions.invoke('manage-moderators', { body: { action: 'add', streamerId, modName, telegramId, discordId }, headers: { 'x-auth-token': authToken } })`
  - `removeModerator` -> `supabase.functions.invoke('manage-moderators', { body: { action: 'remove', streamerId, moderatorId }, headers: { 'x-auth-token': authToken } })`

### 3. No database or RLS changes needed
The edge function uses the service role key, bypassing RLS entirely. Auth is enforced in the function code via token validation and ownership checks.

## Technical Details

Edge function structure (follows `update-streamer-settings` pattern):
1. CORS handling
2. Parse `x-auth-token` header
3. Validate token via `validate_session_token` RPC
4. Verify streamer ownership (with admin bypass via `admin_emails` table)
5. Execute the requested action using service role client
6. Return result

