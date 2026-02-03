
# Fix: Add Missing Streamers to Telegram Notifications

## Problem Identified

The `notify-new-donations` edge function is missing **Wolfy** and **Clumsy God** from its donation tables list. This means:

1. Donations for these streamers are processed correctly (webhook sets `moderation_status: 'pending'`)
2. But Telegram never receives the approval request with Approve/Reject buttons
3. You only see "Donation Approved" messages (sent by `moderate-donation` when you approve from Dashboard)

## Root Cause

In `supabase/functions/notify-new-donations/index.ts` at lines 94-98:

```typescript
// CURRENT (BROKEN) - only 3 streamers:
const donationTables = [
  'ankit_donations',
  'chiaa_gaming_donations',
  'looteriya_gaming_donations',
];
```

Wolfy and Clumsy God are missing!

---

## Solution

### File: `supabase/functions/notify-new-donations/index.ts`

Update lines 94-98 to include all active streamers:

```typescript
// Active donation tables (all 5 streamers)
const donationTables = [
  'ankit_donations',
  'chiaa_gaming_donations',
  'looteriya_gaming_donations',
  'clumsy_god_donations',
  'wolfy_donations',
];
```

---

## What This Fixes

| Before | After |
|--------|-------|
| Wolfy donations: No Telegram approval request | Wolfy donations: Full moderation buttons |
| Clumsy God donations: No Telegram approval request | Clumsy God donations: Full moderation buttons |
| Only see "Approved" notifications | See both "Needs Approval" and action confirmations |

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/notify-new-donations/index.ts` | Add `clumsy_god_donations` and `wolfy_donations` to tables array |

---

## Technical Details

The notification flow after fix:

1. Payment webhook sets `moderation_status: 'pending'` and `mod_notified: false`
2. `notify-new-donations` (cron job or triggered) queries ALL tables for `mod_notified: false`
3. For each pending donation, sends Telegram message with Approve/Reject/Hide/Ban buttons
4. Sets `mod_notified: true` after notification sent
5. Moderator clicks button, `moderate-donation` processes action and sends confirmation
