
## Problem: Two Separate Issues

### Issue 1: The CORS/520 Error (Transient Infrastructure Issue)

The `Access-Control-Allow-Origin` error you see is **not actually a CORS misconfiguration** in the code. The function correctly has `Access-Control-Allow-Origin: *` on line 6 and a proper OPTIONS handler. The real error is the **HTTP 520** that appears alongside it.

A 520 is a **Cloudflare "Unknown Error"** — it means Cloudflare's edge couldn't reach or get a valid response from Supabase's origin servers. When this happens, Cloudflare serves its own error page which has NO `Access-Control-Allow-Origin` header, so the browser incorrectly reports it as a "CORS" error. The function code itself is fine.

This is a **transient Supabase infrastructure issue**, not something fixable in code. The analytics confirm the function was working perfectly 10+ minutes ago (OPTIONS 200, POST 200 at 19:46:19). These 520 errors typically resolve on their own within minutes.

---

### Issue 2: Audio Not Playing Even When Replay Works (The Real Bug)

This is the persistent audio problem. Looking at the database right now:

**Donation: Vishal, ₹150 (id: 141ab851)**
- `audio_scheduled_at`: `19:46:19` (replay triggered)
- `audio_played_at`: `19:46:21` — **only 2 seconds later**
- `tts_audio_url`: `NULL`
- `voice_message_url`: has a valid URL

The `get-current-audio` function polled and marked the donation as `audio_played_at` within **2 seconds** of the replay being triggered. This is the race condition — OBS's Media Source needs time to:
1. Next poll cycle (every 3-5 seconds)
2. Download the webm file from R2 (network time)
3. Buffer it
4. Start playback

By the time OBS even polls, the donation is already marked as played and `get-current-audio` returns nothing.

**Root cause**: The `replay` case in `moderate-donation/index.ts` sets `audio_scheduled_at: new Date().toISOString()` with NO delay. `get-current-audio` then immediately picks it up on the very next poll cycle and marks it played before OBS has fetched it.

---

### The Fix

**In `supabase/functions/moderate-donation/index.ts`**, the `replay` case needs a delay buffer:

**Current (broken):**
```typescript
case 'replay':
  shouldSendOBSAlert = true;
  updateData = { 
    audio_played_at: null,
    audio_scheduled_at: new Date().toISOString()  // immediate — gets consumed in 2 seconds
  };
  break;
```

**Fix:**
```typescript
case 'replay':
  shouldSendOBSAlert = true;
  // Add 8-second delay buffer so OBS has time to poll and download before get-current-audio marks it played
  const replayScheduledAt = new Date(Date.now() + 8000).toISOString();
  updateData = { 
    audio_played_at: null,
    audio_scheduled_at: replayScheduledAt
  };
  break;
```

**In `supabase/functions/get-current-audio/index.ts`**, the function also needs to check that `audio_scheduled_at <= NOW()` before marking as played, so scheduled-in-future donations are not consumed prematurely. Let me check this.

**Also needed — a database migration** to reset the current stuck donations so they can be replayed after the fix:

```sql
-- Reset both stuck voice donations for Brigzard so they can be replayed
UPDATE brigzard_donations
SET 
  audio_played_at = NULL,
  audio_scheduled_at = NOW() + interval '15 seconds'
WHERE id IN (
  '6c854092-bbed-4d8b-9155-1a6559e85b86',  -- Secret Admirer ₹150
  '141ab851-98c9-454a-a64a-1fe850671c57'    -- Vishal ₹150
)
AND payment_status = 'success';

-- Fix invalid TTS voice ID (still not applied from previous session)
UPDATE streamers 
SET tts_voice_id = 'moss_audio_3e9334b7-e32a-11f0-ba34-ee3bcee0a7c9'
WHERE streamer_slug = 'brigzard';
```

---

### Files to Change

1. **`supabase/functions/moderate-donation/index.ts`** — Add 8-second delay to `replay` case `audio_scheduled_at`
2. **`supabase/functions/get-current-audio/index.ts`** — Verify `audio_scheduled_at <= NOW()` filter is applied before marking played (to prevent premature consumption)
3. **Database migration** — Reset stuck donations + fix tts_voice_id

### Scope

Only the `moderate-donation` and `get-current-audio` edge functions are modified, plus a database update for Brigzard's two stuck donations. No other streamers, pages, or UI components are affected.

### For the 520 Error

No code fix needed — it's a transient Cloudflare/Supabase infrastructure blip. If it persists for more than 15-20 minutes, check https://status.supabase.com. Retrying the Replay button once the 520 clears will trigger the audio (after this fix adds the buffer delay).
