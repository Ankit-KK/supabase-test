
# Make Telegram ID and Discord ID Both Optional (Require At Least One)

## Problem
Currently, adding a moderator requires a Telegram User ID (mandatory) with Discord User ID being optional. This prevents adding Discord-only moderators.

## Solution
Allow either field to be optional, but require at least one of the two to be provided.

## Changes

### 1. Database Migration
- Alter `streamers_moderators.telegram_user_id` from `NOT NULL` to nullable:
```sql
ALTER TABLE streamers_moderators ALTER COLUMN telegram_user_id DROP NOT NULL;
```

### 2. `src/components/dashboard/ModeratorManager.tsx`
- Update validation logic: instead of requiring Telegram ID, require **at least one** of Telegram ID or Discord ID
- Update the error message to say "Please provide a name and at least one of Telegram ID or Discord ID"
- Update the button disabled condition to reflect the new rule
- Update the insert to pass `null` for empty Telegram ID (same as Discord ID already does)

### 3. `supabase/functions/notify-new-donations/index.ts`
- Already filters moderators by `discord_user_id` for Discord and `telegram_user_id` for Telegram notifications -- just need to confirm it handles `null` Telegram IDs gracefully (skip sending Telegram DM if no Telegram ID)

### 4. `supabase/functions/manage-telegram-user/index.ts`
- No changes needed -- this function operates on specific Telegram user IDs passed in the request

No other files need to change. The edge functions that query moderators already filter by the relevant ID column, so null values will naturally be excluded.
