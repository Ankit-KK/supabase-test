
# Fix: Dynamic TTS Threshold in Unified Edge Functions

## Problem Identified

The TTS threshold is hardcoded in the edge functions, ignoring the database-controlled `min_tts_amount_inr` column:

| File | Location | Hardcoded Value |
|------|----------|-----------------|
| `check-payment-status-unified/index.ts` | Lines 343-363 | **No threshold check** - always generates TTS |
| `moderate-donation/index.ts` | Lines 349-362 | `donation.amount >= 70` and `< 70` |

When you set `min_tts_amount_inr = 40` in the database, donations at ₹40-69 should get TTS audio, but currently:
- `check-payment-status-unified` always generates TTS (no threshold)
- `moderate-donation` uses hardcoded ₹70, so ₹40-69 donations get silent audio instead

---

## Solution

### 1. Update `check-payment-status-unified/index.ts`

**Add `min_tts_amount_inr` to the streamer settings query (line 202-205):**

```typescript
// BEFORE
.select('moderation_mode, media_moderation_enabled, goal_is_active, goal_target_amount, goal_activated_at')

// AFTER
.select('moderation_mode, media_moderation_enabled, goal_is_active, goal_target_amount, goal_activated_at, min_tts_amount_inr, tts_enabled')
```

**Add dynamic TTS threshold logic before TTS generation (around line 343):**

```typescript
// Add platform floor constant
const PLATFORM_TTS_FLOOR_INR = 40;

// Calculate dynamic TTS threshold from database
const ttsMinAmount = Math.max(
  PLATFORM_TTS_FLOOR_INR, 
  streamerSettings?.min_tts_amount_inr || PLATFORM_TTS_FLOOR_INR
);

console.log(`[Unified] TTS threshold: ${ttsMinAmount} INR (db: ${streamerSettings?.min_tts_amount_inr})`);

// Determine if TTS should be generated
const isTextDonation = !donation.voice_message_url && !donation.hypersound_url && !hasMedia;
const amountInINR = convertToINR(donation.amount, paymentCurrency);

// Generate TTS only if:
// 1. Text/media donation (not voice/hypersound)
// 2. Amount meets TTS threshold
// 3. TTS is enabled for streamer
if (!donation.voice_message_url && !donation.hypersound_url) {
  const shouldGenerateTTS = (isTextDonation && amountInINR >= ttsMinAmount && streamerSettings?.tts_enabled !== false) || hasMedia;
  
  if (shouldGenerateTTS) {
    // Call generate-donation-tts...
  } else if (isTextDonation) {
    // Use silent audio for donations under threshold
    const SILENT_AUDIO_URL = Deno.env.get('SILENT_AUDIO_URL') || 'https://pub-fff13c27bb0d4a1e807dfc596462b7d5.r2.dev/silence_no_sound.mp3';
    await supabase.from(config.table).update({ tts_audio_url: SILENT_AUDIO_URL }).eq('id', donation.id);
    console.log(`[Unified] Using silent audio for donation under ${ttsMinAmount} INR threshold`);
  }
}
```

### 2. Update `moderate-donation/index.ts`

**Add `min_tts_amount_inr` to the streamer query (line 195):**

```typescript
// BEFORE
.select('streamer_slug, pusher_group, tts_enabled, tts_voice_id, telegram_moderation_enabled')

// AFTER
.select('streamer_slug, pusher_group, tts_enabled, tts_voice_id, telegram_moderation_enabled, min_tts_amount_inr')
```

**Replace hardcoded ₹70 with dynamic threshold (lines 343-362):**

```typescript
// Add platform floor constant (around line 343)
const PLATFORM_TTS_FLOOR_INR = 40;
const ttsMinAmount = Math.max(
  PLATFORM_TTS_FLOOR_INR, 
  streamer?.min_tts_amount_inr || PLATFORM_TTS_FLOOR_INR
);
console.log(`TTS threshold for approval: ${ttsMinAmount} INR (db: ${streamer?.min_tts_amount_inr})`);

// BEFORE (lines 349-352)
const shouldGenerateTextTTS = donationType === 'text' && 
  donation.amount >= 70 && 
  !donation.tts_audio_url &&
  streamer.tts_enabled !== false;

// AFTER
const shouldGenerateTextTTS = donationType === 'text' && 
  donation.amount >= ttsMinAmount && 
  !donation.tts_audio_url &&
  streamer.tts_enabled !== false;

// BEFORE (lines 359-362)
const shouldUseSilentAudio = donationType === 'text' && 
  !donation.tts_audio_url &&
  donation.amount < 70;

// AFTER
const shouldUseSilentAudio = donationType === 'text' && 
  !donation.tts_audio_url &&
  donation.amount < ttsMinAmount;
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `check-payment-status-unified/index.ts` | Add `min_tts_amount_inr, tts_enabled` to SELECT; add dynamic TTS threshold check before generating TTS |
| `moderate-donation/index.ts` | Add `min_tts_amount_inr` to SELECT; replace hardcoded `70` with dynamic `ttsMinAmount` |

---

## Result After Fix

When you set `min_tts_amount_inr = 40` for Ankit in the database:

| Donation Amount | Before Fix | After Fix |
|----------------|------------|-----------|
| ₹40-69 | Silent audio (no TTS) | TTS generated |
| ₹70+ | TTS generated | TTS generated |

The platform floor (₹40) ensures no streamer can set TTS minimum below platform limits.
