

# Change audio delay from 60s to 10s

All locations where 60 seconds (60000ms) is used as the standard donation audio delay need to change to 10 seconds (10000ms).

## Files to edit

### Edge Functions (backend scheduling)

1. **`supabase/functions/check-payment-status-unified/index.ts`** (line 260)
   - `const delaySeconds = isQuickAudio ? 15 : 60;` → `const delaySeconds = isQuickAudio ? 10 : 10;`

2. **`supabase/functions/check-payment-status-ankit/index.ts`** (line 241)
   - `Date.now() + 60 * 1000` → `Date.now() + 10 * 1000`

3. **`supabase/functions/check-payment-status-chiagaming/index.ts`** (line 242)
   - `Date.now() + 60 * 1000` → `Date.now() + 10 * 1000`

4. **`supabase/functions/check-payment-status-looteriya-gaming/index.ts`** (line 209)
   - `Date.now() + 60 * 1000` → `Date.now() + 10 * 1000`

5. **`supabase/functions/razorpay-webhook/index.ts`** (line 197)
   - `donation.hypersound_url ? 15000 : 60000` → `donation.hypersound_url ? 10000 : 10000`

### Frontend (OBS overlay display delay)

6. **`src/components/obs/ObsAlertsWrapper.tsx`** (lines 48-50)
   - `hypersound: 15000` → `10000`
   - `text: 60000` → `10000`
   - `voice: 60000` → `10000`

7. **`src/hooks/useAudioPlayer.ts`** (line 53)
   - `delayBeforeDisplay: 60000` → `delayBeforeDisplay: 10000`

All delays unified to 10 seconds across backend and frontend. HyperSound previously had a 15s delay — also changing to 10s since all types now share the same delay.

