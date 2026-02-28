

# Switch Supabase Endpoints from `.co` to `.com`

## Why
Supabase is migrating away from `.supabase.co` domains. Switching to `.supabase.com` ensures continued reliability.

## What Changes

Replace `vsevsjvtrshgeiudrnth.supabase.co` with `vsevsjvtrshgeiudrnth.supabase.com` in these files:

### 1. `.env`
- Update `VITE_SUPABASE_URL` from `.supabase.co` to `.supabase.com`

### 2. `src/integrations/supabase/client.ts`
- Update `SUPABASE_URL` constant

### 3. `src/components/audio-player/MediaSourcePlayer.tsx`
- Update `SUPABASE_PROJECT_URL` constant

### 4. `src/components/dashboard/OBSTokenManager.tsx`
- Update the two hardcoded URLs used for the media source / OBS token display

## What Does NOT Change
- No edge functions modified
- No database changes
- No streamer pages affected
- The anon key stays the same (it's tied to the project, not the domain)

## Risk
None -- Supabase `.supabase.com` endpoints are fully supported and equivalent to `.supabase.co`.
