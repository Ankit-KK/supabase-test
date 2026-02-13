
# Fix: Unauthenticated Edge Functions Allowing Settings Hijacking

## Problem
Two edge functions have **no authentication checks**, allowing anyone with the public anon key to:
1. **`update-streamer-settings`**: Change any streamer's moderation mode, TTS, media settings by just passing a `streamerId`
2. **`broadcast-settings-update`**: Push fake overlay colors/settings to OBS in real-time by passing any `streamer_slug`

This is how the attacker changed overlay colors -- they called `broadcast-settings-update` with a custom `brand_color` and it was pushed directly to the OBS overlay via Pusher.

## Fix

### Step 1: Add authentication to `update-streamer-settings`
- Extract the JWT from the `Authorization` header
- Verify the user via `supabase.auth.getUser()`
- Check that the authenticated user's ID matches the streamer's `user_id`
- Reject unauthenticated or unauthorized requests with 401/403

### Step 2: Add authentication to `broadcast-settings-update`
- Same auth check: extract JWT, verify user, confirm ownership of the streamer slug
- This prevents anyone from pushing fake settings to OBS overlays

### Step 3: Verify no other edge functions are open
Based on the codebase scan, the following edge functions are public-facing by design (donation/payment flow):
- `create-razorpay-order-*` (creates pending orders -- safe with new INSERT RLS)
- `check-payment-status-*` (reads Razorpay status -- safe)
- `get-streamer-pricing`, `list-hypersounds`, `get-pusher-config` (read-only public data)
- `upload-voice-message-direct`, `upload-donation-media` (tied to pending donations)

The webhook functions (`razorpay-webhook`, `telegram-webhook`) validate signatures server-side, so they're safe.

## Technical Details

### `update-streamer-settings/index.ts` changes:
```
// Add at the top of the handler, after CORS check:
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return 401 error "Missing authorization header"
}

// Create a user-context client to verify the JWT
const userClient = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } }
});
const { data: { user }, error } = await userClient.auth.getUser();
if (!user) return 401 error

// Verify the user owns this streamer
const streamer = await serviceClient.from('streamers')
  .select('id, user_id, streamer_name')
  .eq('id', streamerId).single();
if (streamer.user_id !== user.id) return 403 error
```

### `broadcast-settings-update/index.ts` changes:
```
// Same auth pattern:
// 1. Extract Authorization header
// 2. Verify JWT via auth.getUser()
// 3. Look up streamer by slug, confirm user_id matches
// 4. Only then proceed with Pusher broadcast
```

## Impact
- Zero impact on legitimate dashboard usage (dashboard already sends auth headers)
- Blocks all unauthenticated settings changes
- Prevents OBS overlay hijacking via Pusher
- No frontend code changes needed
