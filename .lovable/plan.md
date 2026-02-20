
## Root Cause: razorpay-webhook Missing mr_champion and w_era

### Why Ankit Updates Dashboard Before Status Page, But Mr Champion Doesn't

The Razorpay payment flow works in two phases:
1. **Razorpay fires its webhook** (`razorpay-webhook` edge function) immediately when payment is captured — this is what updates Ankit's dashboard *before* the user even sees the status page
2. **User is redirected to `/status`** → `check-payment-status-unified` runs → sends Pusher events as a fallback

For **Ankit**: the webhook fires → finds the donation in `ankit_donations` → updates DB → sends all Pusher events → dashboard updates. By the time the user reaches the status page, the dashboard is already updated.

For **Mr Champion**: the webhook fires → searches all tables in order → **cannot find the donation** (because `mr_champion_donations` is not in the search list) → logs "Donation not found" → exits. The user reaches the status page, `check-payment-status-unified` runs, *that* sends the Pusher events. Result: dashboard only updates when user is already on the status page, and OBS alerts fire late/incorrectly.

This is confirmed by the edge function logs showing:
```
"Donation not found for Razorpay order: order_SIOVPaS4BzQoAc"
```

### The Fix

**File to edit:** `supabase/functions/razorpay-webhook/index.ts`

Add `mr_champion` and `w_era` to the table search chain (after `brigzard`):

```typescript
// After brigzard lookup (line ~290):
} else {
  // Try w_era
  const wEraResult = await supabase
    .from('w_era_donations')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle()
  
  if (wEraResult.data) {
    donation = wEraResult.data
    streamerType = 'w_era'
    tableName = 'w_era_donations'
  } else {
    // Try mr_champion
    const mrChampionResult = await supabase
      .from('mr_champion_donations')
      .select('*')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle()
    
    if (mrChampionResult.data) {
      donation = mrChampionResult.data
      streamerType = 'mr_champion'
      tableName = 'mr_champion_donations'
    } else {
      fetchError = ... // include wEraResult.error and mrChampionResult.error
    }
  }
}
```

Also add these two streamers to the `streamerSlugMap` at the top of the file:
```typescript
'w_era': 'w_era',
'mr_champion': 'mr_champion',
```

And update the type for `streamerType` to include these two new values.

### Technical Details

- File to edit: `supabase/functions/razorpay-webhook/index.ts`
- The `streamerSlugMap` (lines 21–30) needs `w_era` and `mr_champion` added
- The `streamerType` TypeScript union (line ~193) needs these values added
- The sequential table search chain (lines ~200–304) needs two new lookup blocks appended after `brigzard`
- The `fetchError` aggregation line (line ~296) needs to include the new result errors
- No database changes needed — tables already exist
- No frontend changes needed
- No other edge functions affected
- After this fix, Mr Champion payments will trigger dashboard updates immediately upon payment capture (same timing as Ankit), not only when the user reaches the status page
- W Era gets the same fix as a bonus, since it has the identical problem
