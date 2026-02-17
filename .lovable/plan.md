

## Fix: Add Zishu to Notification Alerts

### Problem
The `notify-new-donations` edge function does not include `zishu_donations` in its `donationTables` array, so Zishu donations never trigger Telegram or Discord moderation alerts.

### Solution
Add `'zishu_donations'` to the `donationTables` array in `supabase/functions/notify-new-donations/index.ts` and redeploy.

### Change
File: `supabase/functions/notify-new-donations/index.ts` (line ~113)

Add `'zishu_donations'` to the array:
```typescript
const donationTables = [
  'ankit_donations',
  'chiaa_gaming_donations',
  'looteriya_gaming_donations',
  'clumsy_god_donations',
  'wolfy_donations',
  'dorp_plays_donations',
  'zishu_donations',
];
```

### Steps
1. Add the missing table entry
2. Redeploy the `notify-new-donations` edge function
3. Verify by testing a Zishu donation and confirming alerts arrive

