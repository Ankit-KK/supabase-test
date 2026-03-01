

# Fix Supabase Client to Use Proxy Domain

## Problem
The Supabase JS client in `src/integrations/supabase/client.ts` uses the direct `vsevsjvtrshgeiudrnth.supabase.co` domain, which is blocked in India. This breaks:
- OBS Browser Source alerts page (can't fetch Pusher config or streamer settings)
- Media Source player page (can't validate OBS tokens)
- Donation pages (can't create orders, check payment status)
- Dashboard access from India

Since the `audio-now-playing` Pusher event is only triggered when `get-current-audio` serves audio, and the OBS alerts page can't connect to Pusher without the config, the entire alert pipeline is broken.

## Solution
Update the Supabase client URL to route through the custom proxy domain `supabase.hyperchat.space`.

## File Change

**`src/integrations/supabase/client.ts`**
- Change `SUPABASE_URL` from `https://vsevsjvtrshgeiudrnth.supabase.co` to `https://supabase.hyperchat.space`
- This routes all frontend Supabase calls (REST, auth, functions, storage) through the proxy

## Impact
- All frontend API calls will go through the proxy -- accessible in India
- OBS Browser Source alerts page will be able to fetch Pusher config and connect
- Media Source player page will be able to validate tokens
- Donation pages will work from India
- No edge functions or other files are changed

## Risk
- The `client.ts` file has a comment saying it's "automatically generated" -- if the Supabase integration regenerates it, this change may be overwritten. But it's the correct fix for now.
- The proxy at `supabase.hyperchat.space` must forward all Supabase paths: `/rest/v1/`, `/auth/v1/`, `/functions/v1/`, `/storage/v1/`

