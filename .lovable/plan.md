

# Fix: Telegram Notifications Not Sent for Auto-Approved Donations

## Root Cause

In `supabase/functions/razorpay-webhook/index.ts` (line 590), Telegram notifications are gated by:

```
if (streamerSettings?.telegram_moderation_enabled && !shouldAutoApprove)
```

This means auto-approved donations (like Ankit's) **never trigger Telegram notifications**. The standalone `notify-new-donations` function handles both cases but has no trigger (no cron job, no database hook) -- it is dead code in practice.

## Fix

Modify the razorpay-webhook to send Telegram notifications for ALL successful donations when `telegram_moderation_enabled` is true, not just pending ones.

- For **pending** donations: Send the full message with Approve/Reject/Hide/Ban action buttons (current behavior)
- For **auto-approved** donations: Send a notification-only message with just the Dashboard link button (no action buttons needed)

## Changes

**File: `supabase/functions/razorpay-webhook/index.ts`**

1. Change the condition on line 590 from:
   ```
   if (streamerSettings?.telegram_moderation_enabled && !shouldAutoApprove)
   ```
   to:
   ```
   if (streamerSettings?.telegram_moderation_enabled)
   ```

2. Inside the block, conditionally create callback mappings only when `!shouldAutoApprove` (pending donations need action buttons, auto-approved ones don't).

3. Pass a flag (e.g., `is_auto_approved: shouldAutoApprove`) in the body sent to `notify-new-donations` so it knows whether to include action buttons.

**No changes** to `notify-new-donations` itself -- it already handles both modes correctly based on `moderation_status`.

**No changes** to any frontend code or other edge functions.

## Technical Detail

The webhook currently builds callback mappings (approve/reject/hide/ban) before calling `notify-new-donations`. For auto-approved donations, we skip creating those mappings and instead pass empty/null callback data, so `notify-new-donations` sends a clean notification-only message with just a Dashboard link.

