

# Fix Media Source URL to Use Custom Proxy Domain

## Problem
The Media Source URL is hardcoded to `vsevsjvtrshgeiudrnth.supabase.co`, which is blocked in India. Streamers in India cannot use the Media Source audio player in OBS because the URL doesn't resolve.

## Solution
Replace the hardcoded Supabase domain with `supabase.hyperchat.space` (the reverse proxy) in both places where the Media Source URL is constructed.

## Files to Change

### 1. `src/components/audio-player/MediaSourcePlayer.tsx`
- Line 11: Change the constant from:
  `const SUPABASE_PROJECT_URL = 'https://vsevsjvtrshgeiudrnth.supabase.co';`
  to:
  `const SUPABASE_PROJECT_URL = 'https://supabase.hyperchat.space';`
- This fixes the Media Source URL shown to all streamers on their `/media-audio-player` pages.

### 2. `src/components/dashboard/OBSTokenManager.tsx`
- Lines 662 and 670: Replace `https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/get-current-audio` with `https://supabase.hyperchat.space/functions/v1/get-current-audio`
- This fixes the Media Source URL shown in the streamer dashboard's OBS Token section.

## What Does NOT Change
- No edge functions modified
- No other streamer pages or components touched
- No database changes
- The `get-current-audio` edge function itself stays the same -- only the client-side URL that points to it changes

