

## Fix: Add `brigzard_donations` to Notification System + Redeploy

### Root Cause

The `notify-new-donations` edge function does NOT include `brigzard_donations` in its `donationTables` array (line 125-133). The deployed code only has 7 tables. This is why:

1. The `razorpay-webhook` correctly processes the Brigzard payment and invokes `notify-new-donations`
2. But `notify-new-donations` polls only the 7 listed tables, skips `brigzard_donations`, finds nothing, and returns "No donations need notification"
3. The donation stays with `mod_notified = false` and no Telegram/Discord alert is ever sent

### Fix

**File:** `supabase/functions/notify-new-donations/index.ts` (line ~133)

Add `'brigzard_donations'` to the `donationTables` array:

```text
const donationTables = [
  'ankit_donations',
  'chiaa_gaming_donations',
  'looteriya_gaming_donations',
  'clumsy_god_donations',
  'wolfy_donations',
  'dorp_plays_donations',
  'zishu_donations',
  'brigzard_donations',    // <-- add this
];
```

Then redeploy the `notify-new-donations` edge function.

### No Other Changes

- The media/voice preview buttons (added in the previous edit) are already in place and will work once Brigzard donations are actually queried
- No frontend or database changes needed

### Verification

After deployment, the existing unnotified donation (`ed5a11ac`, mod_notified=false) should be picked up on the next invocation and sent to moderators with the media preview button.

