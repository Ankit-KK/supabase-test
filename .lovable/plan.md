

## Diagnosis: Missing `audio_scheduled_at` in `check-payment-status-unified`

**Root cause**: The `check-payment-status-unified` edge function sets `payment_status: 'success'` but **never sets `audio_scheduled_at`**. The `get-current-audio` function requires `audio_scheduled_at IS NOT NULL AND audio_scheduled_at <= NOW()` to serve audio. 

When the client polls `check-payment-status-unified` before the Razorpay webhook arrives, the donation gets marked `success` without `audio_scheduled_at`. The webhook then sees `payment_status = 'success'` and skips — so `audio_scheduled_at` is never written. No audio alerts ever play.

This affects **all streamers using the unified flow** (Demigod, and potentially others where client polling beats the webhook).

### Fix

**File**: `supabase/functions/check-payment-status-unified/index.ts`

In the update block (around line 234-245), add `audio_scheduled_at` computation for auto-approved donations, matching the webhook's logic:

1. Compute delay based on donation type (hypersound: 15s, voice/text: 60s)
2. Add `audio_scheduled_at` to the update payload when `shouldAutoApprove` is true
3. Redeploy the function

The delay calculation should match `razorpay-webhook`:
- HyperSound/HyperEmote: `now + 15 seconds`
- Voice/Text/Media: `now + 60 seconds`

### Files Changed
- `supabase/functions/check-payment-status-unified/index.ts` — Add `audio_scheduled_at` to the success update

### Deployment
- Redeploy `check-payment-status-unified`

