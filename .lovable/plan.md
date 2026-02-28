
# Revert Supabase Endpoints Back to `.supabase.co`

## Problem
`vsevsjvtrshgeiudrnth.supabase.com` does not resolve (DNS error). Supabase API/project endpoints use `.supabase.co`, not `.supabase.com`. The `.com` domain is only for the Supabase website/dashboard.

## Fix
Revert all four files that were changed from `.co` to `.com` back to `.co`:

### 1. `src/integrations/supabase/client.ts`
- Change `SUPABASE_URL` back to `https://vsevsjvtrshgeiudrnth.supabase.co`

### 2. `src/components/audio-player/MediaSourcePlayer.tsx`
- Change `SUPABASE_PROJECT_URL` back to `https://vsevsjvtrshgeiudrnth.supabase.co`

### 3. `src/components/dashboard/OBSTokenManager.tsx`
- Change the two hardcoded URLs back to `.supabase.co`

### 4. `.env`
- Already reverted to `.supabase.co` in the last diff -- no change needed

### CSP in `index.html`
- Keep the added `.supabase.com` entries (they don't hurt and provide future-proofing), no change needed

## No other files changed
- No edge functions, streamer pages, or database changes
