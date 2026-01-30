

# Fix: Add Clumsy God to get-current-audio Edge Function

## Problem Identified

The `get-current-audio` edge function is missing the `clumsy_god` streamer mapping, causing all audio and alert requests to fail.

**Error in logs:**
```
ERROR No table mapping for streamer: clumsy_god
```

This is preventing:
- Audio playback in OBS Media Source player
- Visual alert triggers (`audio-now-playing` event)
- Any real-time donation display for Clumsy God

---

## Solution

### File: `supabase/functions/get-current-audio/index.ts`

Add `clumsy_god` to both mapping objects at lines 10-21:

**Current Code (Lines 10-21):**
```typescript
const STREAMER_TABLE_MAP: Record<string, string> = {
  'ankit': 'ankit_donations',
  'chiaa_gaming': 'chiaa_gaming_donations',
  'looteriya_gaming': 'looteriya_gaming_donations',
};

const STREAMER_CHANNEL_MAP: Record<string, string> = {
  'ankit': 'ankit-alerts',
  'chiaa_gaming': 'chiaa_gaming-alerts',
  'looteriya_gaming': 'looteriya_gaming-alerts',
};
```

**Updated Code:**
```typescript
const STREAMER_TABLE_MAP: Record<string, string> = {
  'ankit': 'ankit_donations',
  'chiaa_gaming': 'chiaa_gaming_donations',
  'looteriya_gaming': 'looteriya_gaming_donations',
  'clumsy_god': 'clumsy_god_donations',
};

const STREAMER_CHANNEL_MAP: Record<string, string> = {
  'ankit': 'ankit-alerts',
  'chiaa_gaming': 'chiaa_gaming-alerts',
  'looteriya_gaming': 'looteriya_gaming-alerts',
  'clumsy_god': 'clumsy_god-alerts',
};
```

---

## Technical Details

| Component | Issue | Fix |
|-----------|-------|-----|
| `STREAMER_TABLE_MAP` | Missing `clumsy_god` | Add `'clumsy_god': 'clumsy_god_donations'` |
| `STREAMER_CHANNEL_MAP` | Missing `clumsy_god` | Add `'clumsy_god': 'clumsy_god-alerts'` |

---

## What This Fix Enables

After deployment:
- Media Source player will fetch audio from `clumsy_god_donations` table
- `audio-now-playing` Pusher events will be sent to `clumsy_god-alerts` channel
- OBS alerts will display in sync with audio playback
- TTS, voice messages, and hypersounds will all work correctly

---

## Files to Modify

1. `supabase/functions/get-current-audio/index.ts` - Add clumsy_god mappings

This is a single-file fix that requires redeployment of the edge function.

