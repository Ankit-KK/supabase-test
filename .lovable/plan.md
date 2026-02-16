

# Fix Moderation Alerts Not Sending (Telegram + Discord)

## Root Causes

### Bug 1: Discord notifications never sent
The moderator query in `notify-new-donations` (line 206) does not include `discord_user_id` in the SELECT fields. This means when the code later filters moderators by `discord_user_id`, the field is always `undefined`, and zero Discord DMs are sent.

### Bug 2: Telegram "chat not found" error
The stored Telegram User ID for the "Ankit" moderator is `7HA068059`, which is not a valid Telegram numeric ID. Telegram requires a pure numeric chat ID. This causes the API to return `400 Bad Request: chat not found`.

### Bug 3: Missing donation table
`dorp_plays_donations` is absent from the `donationTables` array, so DorpPlays donations never trigger notifications.

## Changes

### 1. `supabase/functions/notify-new-donations/index.ts`

**Fix the SELECT query (line 206):** Add `discord_user_id` to the selected fields:
```
.select('telegram_user_id, discord_user_id, mod_name, role, can_approve, can_reject, can_hide_message, can_ban')
```

**Add missing table (line 125-131):** Add `'dorp_plays_donations'` to the `donationTables` array.

### 2. Database: Fix invalid Telegram User ID
The moderator record for "Ankit" has `telegram_user_id = '7HA068059'`. The correct numeric Telegram ID needs to be obtained by messaging @userinfobot on Telegram, and then updating the record. If the correct ID is not known, we can set it to `null` so it stops failing.

## Technical Summary
- 1 edge function file edited (2 small fixes)
- 1 database record to update (invalid Telegram ID)
- Redeploy `notify-new-donations`
