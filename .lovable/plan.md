

# Fix: Delay Notifications to Match Audio Schedule

## Problem
When a donation is received, the webhook:
1. Sets `audio_scheduled_at` = now + 60s (regular) or now + 15s (soundboard)
2. Sends Telegram/Discord notification **immediately**

This means the streamer sees the notification 60s (or 15s) before the alert plays on their stream, ruining the surprise element.

## Solution
The notification should only be sent **after** the audio has played, not when payment is confirmed. The cleanest approach is to have the `notify-new-donations` cron job handle all notification-only alerts (auto-approved), since it already runs every minute and checks `mod_notified`. We just need to make sure it only notifies **after** `audio_scheduled_at` has passed.

### File 1: `supabase/functions/razorpay-webhook/index.ts`

**Skip inline notification for auto-approved donations.** Only send instant notifications when moderation is required (the streamer needs to approve/reject before the alert plays anyway).

Change the notification trigger (around line 660):

```text
// Before:
if (streamerSettings?.telegram_moderation_enabled) {
  // ... sends notification immediately for ALL donations

// After:
if (streamerSettings?.telegram_moderation_enabled && !shouldAutoApprove) {
  // ... only sends notification immediately for donations that NEED moderation
  // Auto-approved donations will be notified by the cron after audio plays
```

This way:
- **Moderation ON**: Streamer gets instant notification with Approve/Reject buttons (correct, they need to act before alert plays)
- **Auto-approved**: No instant notification; the cron job handles it after the audio delay has passed

### File 2: `supabase/functions/notify-new-donations/index.ts`

Add a check so the cron only picks up donations whose `audio_scheduled_at` has already passed (meaning the alert has played or is playing):

```text
// Add to the query that fetches un-notified donations:
.or('audio_scheduled_at.is.null,audio_scheduled_at.lte.' + new Date().toISOString())
```

This ensures:
- Regular donations: notified ~60s after payment (after alert plays)
- Soundboard donations: notified ~15s after payment (after alert plays)
- Donations without audio scheduling: notified immediately (fallback)

### No Other Changes
- No database changes
- No frontend changes
- No donation page changes
- The same `notify-new-donations` function handles both Telegram and Discord, so both platforms benefit from this fix

