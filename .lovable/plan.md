

# Fix: Allow hyperchat.site and hyperchat.space in Origin Validation

## Root Cause
The edge function logs show the request is coming from `https://www.hyperchat.site`, which is your custom domain. The current `validateOrigin` only allows `*.lovable.app` subdomains, so requests from your published custom domains are rejected.

## Fix
Update the `validateOrigin` function in all 6 authenticated edge functions to also allow:
- `hyperchat.site` and `www.hyperchat.site`
- `hyperchat.space` and `www.hyperchat.space`

## Files to Change (same pattern in each)

1. `supabase/functions/manage-moderators/index.ts`
2. `supabase/functions/update-streamer-settings/index.ts`
3. `supabase/functions/broadcast-settings-update/index.ts`
4. `supabase/functions/moderate-donation/index.ts`
5. `supabase/functions/generate-obs-token/index.ts`
6. `supabase/functions/transcribe-voice-sarvam/index.ts`

## Change Detail

Replace the hostname check in `validateOrigin` from:

```text
if (!url.hostname.endsWith('.lovable.app')) {
```

To:

```text
const allowed = 
  url.hostname.endsWith('.lovable.app') ||
  url.hostname === 'hyperchat.site' || url.hostname === 'www.hyperchat.site' ||
  url.hostname === 'hyperchat.space' || url.hostname === 'www.hyperchat.space';
if (!allowed) {
```

This keeps the same security posture (only your domains are allowed) while supporting all your custom domains.

## No Other Changes
- No database changes
- No frontend changes
- No donation page changes
