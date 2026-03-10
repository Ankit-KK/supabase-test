

# Fix: Add `nova_plays` to 4 Core Edge Functions

## Problem
The previous plan to add `nova_plays` to the 4 core edge functions was approved but never implemented. All payment and audio functions fail because they can't resolve the `np_rp_` order prefix.

## Changes

### 1. `supabase/functions/check-payment-status-unified/index.ts` (line 31)
Add after demigod:
```typescript
'nova_plays': { table: 'nova_plays_donations', prefix: 'np_rp_' },
```

### 2. `supabase/functions/create-razorpay-order-unified/index.ts` (line 21)
Add after demigod:
```typescript
'nova_plays': { table: 'nova_plays_donations', prefix: 'np_rp_', tableId: 11 },
```

### 3. `supabase/functions/razorpay-webhook/index.ts`
- Line 22: Add `11: 'nova_plays_donations'` to `DONATION_TABLE_ID_MAP`
- Line 32: Add `'nova_plays_donations': 'nova_plays'` to `TABLE_TO_SLUG`

### 4. `supabase/functions/get-current-audio/index.ts`
- Line 21: Add `'nova_plays': 'nova_plays_donations'` to `STREAMER_TABLE_MAP`
- Line 36: Add `'nova_plays': 'nova_plays-alerts'` to `STREAMER_CHANNEL_MAP`

All 4 functions auto-deploy after save.

