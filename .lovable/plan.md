

# Upgrade TTS Sound Quality

## What Changes
Only `supabase/functions/generate-donation-tts/index.ts` — no other edge functions touched.

## Changes (lines 331-350)

1. **Model**: `speech-2.6-hd` → `speech-2.8-hd` (latest model with better tonal nuances and timbre similarity)
2. **Sample rate**: `24000` → `32000` (32kHz, higher fidelity)
3. **Bitrate**: `32000` → `128000` (128kbps, standard high quality for MP3)

Updated block:
```typescript
model: "speech-2.8-hd",
// ...existing voice_setting unchanged...
audio_setting: {
  sample_rate: 32000,
  bitrate: 128000,
  format: "mp3",
  channel: 1,
},
```

Update the comment above `audio_setting` to reflect the new values.

## Trade-off
Files will be ~4x larger (higher bitrate), but sound quality will be noticeably better. This is the recommended config from MiniMax docs for high-quality output.

