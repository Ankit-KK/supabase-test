

# Fix: manage-telegram-user 403 Error for Admin Users

## Root Cause

The `manage-telegram-user` edge function only checks if the authenticated user's `user_id` directly matches the streamer's `user_id`. You are logged in as `ankit.hyperchat@gmail.com` (an admin listed in the `admin_emails` table), but the Ankit streamer is owned by a different account (`ankitashuk20@gmail.com`). Since there is no admin bypass in this function, it returns 403 Forbidden.

Other parts of the system (like the dashboard itself) already check the `admin_emails` table to grant admin access -- but `manage-telegram-user` was never updated to do the same.

## Fix

Add an admin email check to `manage-telegram-user` so that users listed in the `admin_emails` table can manage Telegram users for any streamer.

## Changes

**File: `supabase/functions/manage-telegram-user/index.ts`**

After the existing ownership check (line 52), add an admin bypass:

1. If the `user_id` does not match (would currently return 403), look up the authenticated user's email from the `auth_users` table using their `user_id`
2. Check if that email exists in the `admin_emails` table
3. If it does, allow the request to proceed
4. If not, return 403 as before

```
Pseudocode flow:

if (streamerData.user_id !== validatedUser.user_id) {
  // Check if user is an admin
  -> Get user email from auth_users where id = validatedUser.user_id
  -> Check if email exists in admin_emails table
  -> If not admin, return 403
  // If admin, continue execution
}
```

No frontend changes needed. No other edge functions affected. The function will be redeployed after the edit.

