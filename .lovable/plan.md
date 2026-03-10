

# Fix: Status Token Not Passed to Status Page

## Root Cause

The `create-razorpay-order-unified` edge function generates a `status_token` and returns it in the response (line 308). The `check-payment-status-unified` function requires this token when the donation has a `status_token_hash` (line 142-149), returning **403 "Unauthorized: status_token required"** without it.

**The bug:** Every donation page (NovaPlays, LooteriyaGaming, etc.) navigates to `/status?order_id=...&status=...` but **never includes the `st` (status_token) parameter**. The `Status.tsx` reads `searchParams.get('st')` and sends it as `status_token` in the body — but it's always `null`.

Older streamers worked because their legacy donations didn't have `status_token_hash` in the database, so the check was skipped. All new NovaPlays donations have the hash, so they all fail.

## Fix

### 1. All donation pages — Pass `status_token` in the navigate URL

Every streamer page that calls `create-razorpay-order-unified` needs to include `&st=${data.status_token}` in the status page redirect. Files to update:

- `src/pages/NovaPlays.tsx` (lines 128-129)
- `src/pages/LooteriyaGaming.tsx` (lines 219, 224)
- `src/pages/Ankit.tsx`
- `src/pages/ChiaaGaming.tsx`
- `src/pages/ClumsyGod.tsx`
- `src/pages/Wolfy.tsx`
- `src/pages/DorpPlays.tsx`
- `src/pages/Zishu.tsx`
- `src/pages/Brigzard.tsx`
- `src/pages/WEra.tsx`
- `src/pages/MrChampion.tsx`
- `src/pages/Demigod.tsx`

Pattern change in each file:
```typescript
// Before:
navigate(`/status?order_id=${data.orderId}&status=success`);
// After:
navigate(`/status?order_id=${data.orderId}&status=success&st=${data.status_token}`);
```

Same for the `ondismiss` / pending navigations.

### 2. `docs/ADD_NEW_STREAMER.md` — Update template

Add `&st=${data.status_token}` to the Razorpay handler/ondismiss navigate calls in the donation page template so future streamers include it.

### Summary
- 12 donation page files: add `&st=${data.status_token}` to navigate calls
- 1 doc file: update template
- No edge function changes needed

