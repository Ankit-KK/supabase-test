

## Plan: Fix `moderate-donation` 404 — Missing `selected_gif_id` Column

### Root Cause

The `moderate-donation` edge function queries `selected_gif_id` on line 278 for ALL donation tables, but only `looteriya_gaming_donations` has that column. When called for `ankit_donations`, it fails with a Postgres error (`column does not exist`), which the function catches and returns as a 404 "Donation not found".

### Fix

**`supabase/functions/moderate-donation/index.ts`** — Remove `selected_gif_id` from the generic select query on line 278. Instead, handle it conditionally or omit it since it's only used in the alert data (line 437) and can default to `null`.

Change line 278 from:
```ts
.select('id, name, amount, amount_inr, currency, message, voice_message_url, tts_audio_url, hypersound_url, is_hyperemote, media_url, media_type, moderation_status, payment_status, message_visible, streamer_id, selected_gif_id, created_at')
```
to:
```ts
.select('id, name, amount, amount_inr, currency, message, voice_message_url, tts_audio_url, hypersound_url, is_hyperemote, media_url, media_type, moderation_status, payment_status, message_visible, streamer_id, created_at')
```

And on line 437, default `selected_gif_id` to `null`:
```ts
selected_gif_id: (donation as any).selected_gif_id || null,
```

This keeps the field available for tables that have it (like looteriya_gaming) without breaking tables that don't.

