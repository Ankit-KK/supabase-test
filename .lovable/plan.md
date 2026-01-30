

# Fix: Add TTS Threshold Check to Razorpay Webhook

## Problem Identified

The `razorpay-webhook` edge function generates TTS for **every** auto-approved text/media donation without checking the `min_tts_amount_inr` threshold from the database.

### Current Broken Flow

```text
Payment Captured via Webhook
         ↓
razorpay-webhook/index.ts
         ↓
Line 273-275: Fetches streamer settings
  ❌ MISSING: min_tts_amount_inr, tts_enabled
         ↓
Lines 472-498: TTS generation
  ❌ NO threshold check - generates TTS for ALL amounts
         ↓
Result: ₹40 donation gets TTS even when min is ₹100
```

### Database Values (Current)
| Streamer | min_tts_amount_inr |
|----------|-------------------|
| Ankit | 100 |
| Chiaa Gaming | null (should use platform floor: 40) |
| Looteriya Gaming | 70 |
| Clumsy God | 70 |

---

## Solution

### File: `supabase/functions/razorpay-webhook/index.ts`

**Step 1: Update the streamer settings query (line 273-277)**

Add `min_tts_amount_inr` and `tts_enabled` to the SELECT:

```typescript
// BEFORE (line 275)
.select('moderation_mode, telegram_moderation_enabled, media_moderation_enabled')

// AFTER
.select('moderation_mode, telegram_moderation_enabled, media_moderation_enabled, min_tts_amount_inr, tts_enabled')
```

**Step 2: Add TTS threshold logic before TTS generation (around line 470)**

Replace the simple TTS generation block with threshold-aware logic:

```typescript
// Only send audio queue events for auto-approved donations
if (shouldAutoApprove) {
  // Dynamic TTS threshold from database
  const PLATFORM_TTS_FLOOR_INR = 40;
  const ttsMinAmount = Math.max(
    PLATFORM_TTS_FLOOR_INR, 
    streamerSettings?.min_tts_amount_inr || PLATFORM_TTS_FLOOR_INR
  );
  
  const amountInINR = convertToINR(donation.amount, paymentCurrency);
  console.log(`[Webhook] TTS threshold: ${ttsMinAmount} INR, Donation: ${amountInINR} INR`);

  // Determine donation type
  const isTextDonation = !donation.voice_message_url && !donation.hypersound_url && !hasMedia;
  
  // Generate TTS only if:
  // 1. Text donation >= TTS threshold, OR
  // 2. Media donation (always announced)
  // 3. TTS is enabled for streamer
  const shouldGenerateTTS = 
    (!donation.voice_message_url && !donation.hypersound_url) &&
    ((isTextDonation && amountInINR >= ttsMinAmount) || hasMedia) &&
    streamerSettings?.tts_enabled !== false;

  if (shouldGenerateTTS) {
    try {
      console.log('Generating TTS for donation:', donation.id);
      const ttsResponse = await supabase.functions.invoke('generate-donation-tts', {
        body: {
          username: donation.name,
          amount: donation.amount,
          message: donation.message,
          donationId: donation.id,
          streamerId: donation.streamer_id,
          isVoiceAnnouncement: false,
          isMediaAnnouncement: hasMedia,
          mediaType: donation.media_type,
          currency: paymentCurrency
        }
      });
      
      if (ttsResponse.error) {
        console.error('TTS generation failed:', ttsResponse.error);
      } else {
        console.log('TTS generated successfully:', ttsResponse.data?.audioUrl);
      }
    } catch (ttsError) {
      console.error('TTS generation error:', ttsError);
    }
  } else if (isTextDonation) {
    // Use silent audio for text donations under threshold (triggers visual alert only)
    const SILENT_AUDIO_URL = Deno.env.get('SILENT_AUDIO_URL') || 
      'https://pub-fff13c27bb0d4a1e807dfc596462b7d5.r2.dev/silence_no_sound.mp3';
    
    await supabase.from(tableName).update({ tts_audio_url: SILENT_AUDIO_URL }).eq('id', donation.id);
    console.log(`[Webhook] Using silent audio for donation under ${ttsMinAmount} INR threshold`);
  }

  // ... rest of audio queue event code
}
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Line 275 | Add `min_tts_amount_inr, tts_enabled` to SELECT query |
| Lines 470-498 | Add TTS threshold check before calling `generate-donation-tts` |
| New | Add silent audio fallback for donations under threshold |

---

## Expected Behavior After Fix

| Donation Amount | min_tts_amount_inr = 100 | Result |
|----------------|--------------------------|--------|
| ₹40 text | Under threshold | Silent audio (visual alert only) |
| ₹70 text | Under threshold | Silent audio (visual alert only) |
| ₹100+ text | Meets threshold | TTS generated |
| Any media | Always | TTS announcement generated |
| Voice/Hypersound | N/A | Uses uploaded audio |

---

## Files to Modify

1. `supabase/functions/razorpay-webhook/index.ts` - Add TTS threshold check

This is the only file that needs changes. The `check-payment-status-unified` and `moderate-donation` functions already have the correct threshold logic from the previous fix.

