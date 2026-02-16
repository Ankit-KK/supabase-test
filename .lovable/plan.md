

# Discord Moderation Bot -- Parallel to Telegram

## Overview
Add a Discord bot that DMs moderators with donation notifications and interactive Approve/Reject/Hide/Ban buttons, working independently alongside the existing Telegram bot. Each can be toggled on/off separately in the dashboard.

---

## Database Changes

### 1. Add `discord_moderation_enabled` column to `streamers`
```sql
ALTER TABLE streamers ADD COLUMN discord_moderation_enabled boolean DEFAULT false;
```

### 2. Add `discord_user_id` column to `streamers_moderators`
```sql
ALTER TABLE streamers_moderators ADD COLUMN discord_user_id text;
```
This allows each moderator to optionally have both a Telegram ID and a Discord ID.

### 3. Add `discord_callback_mapping` table
Same structure as `telegram_callback_mapping`, used to map short button IDs to donation actions in Discord interactions.
```sql
CREATE TABLE discord_callback_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id text UNIQUE NOT NULL,
  donation_id text NOT NULL,
  table_name text NOT NULL,
  streamer_id text NOT NULL,
  action_type text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE discord_callback_mapping ENABLE ROW LEVEL SECURITY;
```

---

## New Edge Functions

### 1. `discord-webhook` (receives Discord Interactions)
- Handles Discord interaction webhook (button clicks from DMs)
- Verifies Discord request signature using `DISCORD_PUBLIC_KEY`
- Parses the button `custom_id`, looks up `discord_callback_mapping`
- Calls `moderate-donation` with `source: 'discord'` (new source type)
- Responds with updated message text showing action result

### 2. `setup-discord-webhook` (registers interaction endpoint)
- Called from the dashboard to configure the Discord bot's interaction endpoint URL
- Uses Discord API to set the interaction endpoint on the bot application

---

## Modified Edge Functions

### 1. `notify-new-donations` (add Discord DM logic)
- After sending Telegram notifications, check `discord_moderation_enabled`
- Query moderators that have a `discord_user_id`
- Send DM to each Discord moderator via Discord API (`POST /users/@me/channels` then `POST /channels/{id}/messages`)
- Include Action Row buttons: Approve, Reject, Hide Msg, Ban (using `discord_callback_mapping` short IDs as `custom_id`)
- Mark `mod_notified = true` once at least one platform (Telegram or Discord) succeeds

### 2. `moderate-donation` (accept `source: 'discord'`)
- Add `'discord'` to the allowed `source` values
- For Discord source, validate moderator by `discord_user_id` lookup (same pattern as Telegram)

---

## Frontend Changes

### 1. `ModerationPanel.tsx` -- Add Discord toggle
- Add a `discord_moderation_enabled` switch next to the existing Telegram toggle
- Fetch/update the new column from `streamers` table

### 2. `ModeratorManager.tsx` -- Add Discord User ID field
- Add an optional "Discord User ID" input when adding/editing moderators
- Show Discord ID alongside Telegram ID in the moderator list
- Update instructions section with how to get a Discord User ID (Developer Mode > right-click user > Copy User ID)

---

## Secrets Required
- `DISCORD_BOT_TOKEN` -- the bot token (user already has this)
- `DISCORD_PUBLIC_KEY` -- from the Discord Developer Portal, used to verify interaction signatures
- `DISCORD_APPLICATION_ID` -- the bot's application ID, for API calls

---

## Architecture Flow

```text
Donation succeeds (payment_status = 'success')
         |
   notify-new-donations (cron)
         |
    +----+----+
    |         |
Telegram?  Discord?
    |         |
 DM mods   DM mods (via Discord API)
 w/buttons  w/buttons (Action Rows)
    |         |
 Button      Button
 click       click
    |         |
telegram-  discord-
webhook    webhook
    |         |
    +----+----+
         |
  moderate-donation
  (approve/reject/hide/ban)
         |
  Update DB + Pusher alert
```

---

## Implementation Order
1. Add database columns and new table
2. Add secrets (`DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`)
3. Create `discord-webhook` edge function (interaction handler)
4. Create `setup-discord-webhook` edge function
5. Update `notify-new-donations` to send Discord DMs with buttons
6. Update `moderate-donation` to accept `source: 'discord'`
7. Update `ModerationPanel.tsx` with Discord toggle
8. Update `ModeratorManager.tsx` with Discord User ID field
9. Deploy and configure the interaction endpoint URL
10. Test end-to-end

