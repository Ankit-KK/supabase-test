
# Fix Media Moderation and Telegram Notifications

## Problem Summary

Two critical bugs are breaking the moderation system for media donations:

| Issue | Root Cause | Impact |
|-------|-----------|--------|
| 1. Wrong Telegram message | `notify-new-donations` only checks `moderation_mode === 'manual'`, ignoring `media_moderation_enabled` | Media donations show as "Auto-Approved" instead of "Needs Approval" in Telegram |
| 2. Telegram buttons fail | callback_data exceeds 64-byte limit (e.g., `approve_381f6e9f-9691-457d-b77f-e7ffc97c4165_looteriya_gaming_donations`) | All Telegram inline buttons fail with `BUTTON_DATA_INVALID` error |
| 3. Unused callback mappings | Webhook creates shortened callbacks but `notify-new-donations` ignores them | Shortened callback system not being used |

---

## Technical Analysis

### Current Flow (Broken)

```text
Webhook                           notify-new-donations
   |                                      |
   +--> Creates shortened callbacks       |
   |    (a_Abc12345)                      |
   |                                      |
   +--> Invokes notify-new-donations ---> Ignores passed callbacks
        with callback_data                Queries DB for mod_notified=false
                                          Builds own LONG callbacks
                                          --> BUTTON_DATA_INVALID
```

### Database State

All 3 active streamers have:
- `moderation_mode: 'auto_approve'`  
- `media_moderation_enabled: true`
- `telegram_moderation_enabled: true` (Looteriya Gaming)

When a media donation comes in with these settings:
- Webhook correctly sets `moderation_status = 'pending'`
- But `notify-new-donations` checks `moderation_mode === 'manual'` (false)
- So it shows "Auto-Approved" message instead of moderation buttons

---

## Solution

### Fix 1: Update `notify-new-donations` to handle media moderation mode

Update the pending detection logic to check for actual `moderation_status: 'pending'` rather than relying on `moderation_mode === 'manual'`:

```typescript
// OLD (broken):
const isManualMode = streamer.moderation_mode === 'manual';
const isPending = donation.moderation_status === 'pending';

let messageText = isManualMode && isPending
  ? `🎁 <b>New Donation - Needs Approval</b> 🎁\n\n`
  : `🎁 <b>New Donation Received!</b> 🎁\n\n`;

// NEW (fixed):
const isPending = donation.moderation_status === 'pending';

let messageText = isPending
  ? `🎁 <b>New Donation - Needs Approval</b> 🎁\n\n`
  : `🎁 <b>New Donation Received!</b> 🎁\n\n`;
```

### Fix 2: Use shortened callback format in `notify-new-donations`

Implement the same callback mapping system used in the webhook:

```typescript
// Add helper function to create callback mapping
async function createCallbackMapping(
  supabase: any,
  donationId: string,
  tableName: string,
  streamerId: string,
  action: string
): Promise<string> {
  const shortId = generateShortId();
  
  const { error } = await supabase
    .from('telegram_callback_mapping')
    .insert({
      short_id: shortId,
      donation_id: donationId,
      table_name: tableName,
      streamer_id: streamerId,
      action_type: action,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  
  if (error) {
    // Fallback to truncated format
    return `${action.charAt(0)}_${donationId.substring(0, 8)}`;
  }
  
  const actionPrefix = {
    'approve': 'a', 'reject': 'r', 
    'hide_message': 'h', 'ban_donor': 'b', 'replay': 'p'
  }[action] || action.charAt(0);
  
  return `${actionPrefix}_${shortId}`;  // e.g., "a_Abc12345" (~10 chars)
}
```

Then update the keyboard building:

```typescript
// OLD (breaks 64-byte limit):
row1.push({ text: '✅ Approve', callback_data: `approve_${donation.id}_${donation.source_table}` });

// NEW (shortened):
const approveCallback = await createCallbackMapping(supabase, donation.id, donation.source_table, donation.streamer_id, 'approve');
row1.push({ text: '✅ Approve', callback_data: approveCallback });
```

### Fix 3: Update keyboard display logic for pending media donations

Change the condition for showing approve/reject buttons:

```typescript
// OLD:
if (isManualMode && isPending) {
  // Show approve/reject buttons
}

// NEW:
if (isPending) {
  // Show approve/reject buttons for ANY pending donation
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/notify-new-donations/index.ts` | Add `generateShortId()` and `createCallbackMapping()` helpers; Update message logic to use `isPending` instead of `isManualMode && isPending`; Update keyboard logic to use shortened callbacks |

---

## Deployment Steps

1. Update `notify-new-donations` edge function
2. Deploy the function
3. Test by making a media donation to Looteriya Gaming

---

## Expected Results After Fix

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Media donation with `media_moderation_enabled=true` | Telegram shows "New Donation Received!" with no approval buttons, or `BUTTON_DATA_INVALID` error | Telegram shows "New Donation - Needs Approval" with working Approve/Reject buttons |
| Callback button clicks | Fails silently | Works correctly via `telegram_callback_mapping` table |
| Dashboard moderation queue | Works (already working) | Works (unchanged) |
