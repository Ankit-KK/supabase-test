
## Problem: Voice Message Audio Alert Not Playing for Brigzard

### What Is Actually Happening

The investigation reveals **two separate but compounding problems**:

---

### Problem 1: `tts_voice_id` Never Fixed (Planned Migration Not Applied)

The database still shows `tts_voice_id = 'English_radiant_girl'` for Brigzard. The SQL fix that was planned in a previous session was **never executed**. This means:

- Every text donation that goes through TTS generation fails silently
- `tts_audio_url` stays NULL for text donations
- Those donations are permanently skipped by `get-current-audio`

This does NOT affect the current voice message donation (which has `voice_message_url` set), but it will break every future text donation.

---

### Problem 2: The Replay "Race Condition" — Audio Marked Played Before OBS Hears It

The specific donation (`Secret Admirer, ₹150`) has a `voice_message_url` set correctly. Here is the exact timeline from the logs and database:

```text
19:26:37  → Replay #1 triggered: audio_played_at = NULL, audio_scheduled_at = now()
19:28:37  → audio_scheduled_at set (from replay #2 attempt at 19:28:36)
19:28:40  → get-current-audio picks up donation, marks audio_played_at = 19:28:40
            → Redirects OBS to the voice_message_url
            → OBS must now download + buffer + play the audio
```

Currently, `audio_played_at` is set to `19:28:40` — but OBS never played the audio because either:

1. **OBS Media Source is not actively polling**: The Media Source URL must be constantly refreshed by OBS (every 3-5 seconds). If OBS is not set up with auto-reload (via Advanced Scene Switcher or a timed source), the `get-current-audio` function serves the file but OBS never fetches the redirect.

2. **OBS is using Browser Source instead of Media Source**: The Browser Source player works differently — it uses Pusher real-time events (`audio-now-playing`) to trigger playback. The voice message gets played via an HTML audio element in the browser. The `audio-now-playing` Pusher event IS being fired (logs confirm it), but the browser source audio context may be blocked (requires "Control Audio via OBS" to be enabled).

---

### The Fix

**Two changes needed:**

#### Fix 1: Apply the `tts_voice_id` database update (missed from before)

This is a single SQL migration:

```sql
UPDATE streamers 
SET tts_voice_id = 'moss_audio_3e9334b7-e32a-11f0-ba34-ee3bcee0a7c9'
WHERE streamer_slug = 'brigzard';
```

This ensures all future text donations generate TTS correctly.

#### Fix 2: Reset the current stuck donation so it can be replayed cleanly

The current donation has `audio_played_at` already set (the function consumed it but OBS didn't hear it). To replay it properly:

```sql
UPDATE brigzard_donations
SET 
  audio_played_at = NULL,
  audio_scheduled_at = NOW() + interval '5 seconds'
WHERE id = '6c854092-bbed-4d8b-9155-1a6559e85b86';
```

Setting `audio_scheduled_at` 5 seconds in the future prevents an immediate race condition where `get-current-audio` marks it played before OBS has time to poll and fetch the audio.

---

### What the Streamer Needs to Do in OBS

After the DB fix, for the audio to actually play:

**If using Media Source Player:**
- The OBS Media Source must be set to **auto-reload every 3-5 seconds** (using Advanced Scene Switcher plugin or similar)
- Network Buffering must be 2 MB or above (not 0 — crashes OBS)
- When the Media Source reloads and `get-current-audio` returns the audio, OBS downloads and plays it

**If using Browser Source Player:**
- Must have **"Control Audio via OBS"** checked in the Browser Source properties
- The `audio-now-playing` Pusher event triggers the alert (already firing correctly per logs)

---

### Files to Change

**Database migration only** — two SQL statements:
1. Fix the invalid `tts_voice_id` for Brigzard
2. Reset the stuck voice donation so it can be replayed from OBS

No frontend code, no edge function changes. No other streamers are affected.
