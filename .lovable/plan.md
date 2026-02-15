

# Fix Missing TTS for DorpPlays

## Problem
The `generate-donation-tts` edge function has a `donationTableMap` that maps streamer slugs to their donation tables. The `dorp_plays` entry was never added, so when TTS is triggered for a DorpPlays donation, it throws: `"No donation table configured for streamer: dorp_plays"`.

## Fix
Add one line to the `donationTableMap` in `supabase/functions/generate-donation-tts/index.ts`:

```
dorp_plays: "dorp_plays_donations",
```

## Technical Details
- **File**: `supabase/functions/generate-donation-tts/index.ts` (line 233, after `wolfy`)
- **Scope**: Single line addition to an existing map -- no other files affected
- **Deploy**: The edge function will be redeployed after the change

No other files need changes. The database already has `tts_enabled: true` and a default voice configured for DorpPlays.

