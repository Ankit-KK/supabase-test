

# Fix: Trigger Notifications at Exact Audio Play Time

## Problem
The cron job runs every minute, so even after `audio_scheduled_at` passes, there can be up to 60 seconds of additional delay before the notification is sent. You want notifications to arrive at the **exact moment** the audio plays on stream.

## Solution
The `get-current-audio` edge function is called by OBS the instant the audio is ready to play. It already marks the donation as played and triggers Pusher visual alerts at that exact moment. We can piggyback on this to also trigger the notification.

### File: `supabase/functions/get-current-audio/index.ts`

After marking the donation as played (line 137) and triggering the Pusher alert, add a **fire-and-forget** call to `notify-new-donations` for this specific donation. This ensures the streamer gets notified at the exact second the audio plays.

**What to add (after the Pusher block, around line 186):**

```text
// Fire-and-forget: trigger notification for this donation NOW
if (!donation.mod_notified) {
  fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-new-donations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ donation_id: donation.id, table_name: tableName })
    }
  ).catch(err => console.error('Notification trigger failed:', err));
}
```

### File: `supabase/functions/notify-new-donations/index.ts`

Update to accept an optional `donation_id` + `table_name` in the request body. When provided, it processes only that single donation instead of scanning all tables. This makes the real-time trigger fast and targeted.

**Changes:**
1. Parse the request body for `donation_id` and `table_name`
2. If both are present, query only that specific donation from that table
3. If not present, fall back to the existing full-scan behavior (for the cron safety net)

### File: `supabase/functions/get-current-audio/index.ts` (query update)

Add `mod_notified` to the select query so we know whether to trigger the notification.

### What about the cron job?
The cron job remains as a safety net for edge cases (e.g., donations without audio, or if the fire-and-forget call fails). But in the normal flow, notifications will now arrive at the exact moment the audio plays -- zero delay.

### Summary of timing:
- **Moderation ON**: Instant notification (from webhook) with approve/reject buttons -- unchanged
- **Auto-approved**: Notification sent at exact audio play time (from `get-current-audio`) -- fixed
- **Cron fallback**: Still runs every minute as safety net -- unchanged

### No Other Changes
- No database changes
- No frontend changes  
- No donation page changes

