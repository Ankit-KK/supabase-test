

# Telegram Notifications for Auto-Approved Donations (Backend-Only Change)

## Approach

No new database columns. No new UI toggles. The existing **"Telegram Moderation"** toggle controls everything:

- **Toggle ON + Manual mode**: Current behavior (notification with Approve/Reject/Hide/Ban buttons)
- **Toggle ON + Auto-approve mode**: Send a clean notification-only message (amount, sender, message, time) with just a Dashboard link -- no action buttons
- **Toggle OFF**: No Telegram messages at all (current behavior)

## What Changes

**Single file**: `supabase/functions/notify-new-donations/index.ts`

### Current Problem (line ~139)

When `telegram_moderation_enabled` is true and donations are auto-approved, the function still sends messages with Replay/Hide buttons. This is unnecessary clutter. The user wants a simple "you got a donation" alert.

### Changes

1. **When donation is NOT pending (auto-approved)**: Send a simplified notification message:
   - Amount with currency
   - Sender name
   - Time (IST)
   - Message preview (if any)
   - Media indicator (if any)
   - "Auto-Approved" status
   - Dashboard link only -- no Replay/Hide/Ban buttons

2. **When donation IS pending**: Keep current behavior with full moderation buttons (Approve/Reject/Hide/Ban).

This means the `isPending` branch (lines ~180-220) stays exactly the same. Only the `else` branch (lines ~220-240) changes to remove the action buttons and just include the Dashboard link.

### Technical Detail

In the `for (const moderator of moderators)` loop, the `else` block (non-pending donations) currently builds Replay and Hide buttons. This will be simplified to:

```text
// For auto-approved: just a dashboard link, no action buttons
keyboard = [[{ text: 'Dashboard', url: `https://hyperchat.site/dashboard/${streamer.streamer_slug}` }]];
```

The message text for auto-approved donations will also be simplified to a clean notification format without moderation language.

### Files NOT Changed

- No dashboard UI components
- No database migrations
- No other edge functions
- No donation pages or OBS alerts

