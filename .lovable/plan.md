

# Show Discord Auth Link + Remove Bot Setup Cards

## Changes

### 1. `src/components/dashboard/ModeratorManager.tsx`

**Remove the two setup cards**: Delete the "Telegram Bot Setup" card and the "Discord Bot Setup" card entirely (the sections with `setupTelegramWebhook` and `setupDiscordWebhook` buttons). Also remove all related state variables (`setupStatus`, `discordSetupStatus`) and handler functions (`setupTelegramWebhook`, `setupDiscordWebhook`).

**Add Discord auth link in the "Add Moderator" form**: When the Discord ID field is visible or filled, show a helper message with the authorization link:

```
To receive DMs, the moderator must first authorize the bot:
https://discord.com/oauth2/authorize?client_id=1473061793189593219
```

This link will be displayed as a clickable link below the Discord User ID input field, so moderators know to authorize the bot before expecting DM notifications.

### 2. No edge function changes

The `setup-telegram-webhook` and `setup-discord-webhook` edge functions remain untouched (per project rules -- do not delete existing backend code). They just won't be called from the UI anymore.

## Technical Summary
- 1 file modified: `ModeratorManager.tsx`
- Remove ~60 lines (two Card sections + state/handlers)
- Add ~5 lines (Discord auth link below the input)

