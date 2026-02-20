
## Root Cause: Payment Failure for Mr Champion

The payment itself **succeeds** on Razorpay's side (database shows 2 successful `mc_rp_` donations), but the status check function crashes during post-payment processing, causing the status page to show "payment failed."

### The Bug

In `supabase/functions/check-payment-status-unified/index.ts` at **line 334**, the leaderboard query uses `.tableName` which does not exist on the `STREAMER_CONFIG` object in that file:

```
// STREAMER_CONFIG shape in this file:
{ table: 'mr_champion_donations', prefix: 'mc_rp_' }
//        ^--- correct key is .table, NOT .tableName
```

The faulty line:
```typescript
.from(STREAMER_CONFIG[streamerSlug].tableName)  // ❌ undefined → crashes
```

This throws an unhandled runtime error inside the `shouldAutoApprove` block. Since the `try/catch` for the leaderboard only wraps the leaderboard logic (lines 331–367), and the crash propagates up, the entire edge function returns a 400 error — even though payment was actually successful.

### The Fix

**File to edit:** `supabase/functions/check-payment-status-unified/index.ts`

**Change at line 334:**
```typescript
// FROM (broken):
.from(STREAMER_CONFIG[streamerSlug].tableName)

// TO (correct):
.from(config.table)
```

`config` is already defined earlier in the function as `const config = STREAMER_CONFIG[streamerSlug]` and has the `.table` property. This is consistent with how all other queries in this function reference the donations table.

### What This Fix Does

- Fixes the leaderboard query to use the correct table name
- Prevents the edge function from crashing after a successful Razorpay payment
- The status page will correctly show "success" instead of "payment failed"
- No other streamer pages, edge functions, or database tables are affected
- The two existing successful Mr Champion donations already in the database confirm the payment system works end-to-end — only this post-payment step was broken
