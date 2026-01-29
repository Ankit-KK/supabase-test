

# Streamer-Controlled Minimums (Database-Only) - Updated with TTS

## Overview

Admins set custom minimum amounts directly in the `streamers` table via Supabase dashboard. No frontend settings UI needed.

## Database Columns to Add

| Column | Description | Platform Default |
|--------|-------------|------------------|
| `min_text_amount_inr` | Minimum for text-only donations | 40 INR |
| `min_tts_amount_inr` | Minimum for TTS (text-to-speech) donations | 40 INR |
| `min_voice_amount_inr` | Minimum for voice recordings | 150 INR |
| `min_hypersound_amount_inr` | Minimum for HyperSounds | 30 INR |
| `media_min_amount` | Minimum for media uploads | 100 INR (already exists) |

---

## Implementation Steps

### Step 1: Database Migration

Add 4 nullable columns to `streamers` table:

```sql
ALTER TABLE streamers
ADD COLUMN IF NOT EXISTS min_text_amount_inr numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_tts_amount_inr numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_voice_amount_inr numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_hypersound_amount_inr numeric DEFAULT NULL;
```

- `NULL` = use platform default
- `media_min_amount` already exists

### Step 2: Update Edge Function

Modify `create-razorpay-order-unified/index.ts`:

```typescript
// Platform floors (cannot go below)
const PLATFORM_FLOORS_INR = { 
  text: 40, 
  tts: 40, 
  voice: 150, 
  hypersound: 30, 
  media: 100 
};

// Exchange rates
const EXCHANGE_RATES_TO_INR = { INR: 1, USD: 89, EUR: 94, GBP: 113, AED: 24, AUD: 57 };

// Auto-rounding function
const roundToNice = (value: number, currency: string): number => {
  if (currency === 'INR') return Math.ceil(value / 10) * 10;
  if (currency === 'AED') return Math.ceil(value);
  return Math.ceil(value * 2) / 2; // USD/EUR/GBP/AUD to nearest 0.50
};

// Fetch with custom minimums
const { data: streamerData } = await supabase
  .from('streamers')
  .select('id, streamer_name, min_text_amount_inr, min_tts_amount_inr, min_voice_amount_inr, min_hypersound_amount_inr, media_min_amount, tts_enabled')
  .eq('streamer_slug', streamer_slug)
  .single();

// Calculate effective minimums in INR
const effectiveINR = {
  text: Math.max(PLATFORM_FLOORS_INR.text, streamerData.min_text_amount_inr || 0),
  tts: Math.max(PLATFORM_FLOORS_INR.tts, streamerData.min_tts_amount_inr || 0),
  voice: Math.max(PLATFORM_FLOORS_INR.voice, streamerData.min_voice_amount_inr || 0),
  hypersound: Math.max(PLATFORM_FLOORS_INR.hypersound, streamerData.min_hypersound_amount_inr || 0),
  media: Math.max(PLATFORM_FLOORS_INR.media, streamerData.media_min_amount || 0),
};

// Convert to donor's currency with auto-rounding
const rate = EXCHANGE_RATES_TO_INR[currency] || 1;
const minimums = {
  minText: roundToNice(effectiveINR.text / rate, currency),
  minTts: roundToNice(effectiveINR.tts / rate, currency),
  minVoice: roundToNice(effectiveINR.voice / rate, currency),
  minHypersound: roundToNice(effectiveINR.hypersound / rate, currency),
  minMedia: roundToNice(effectiveINR.media / rate, currency),
};

// Validation logic (TTS vs plain text)
if (!hypersoundUrl && !voiceMessageUrl && !mediaUrl) {
  // It's a text donation - check if TTS applies
  const requiredMin = streamerData.tts_enabled ? minimums.minTts : minimums.minText;
  if (amount < requiredMin) {
    throw new Error(`Text messages require minimum ${currency} ${requiredMin}`);
  }
}
```

### Step 3: Create Pricing API

New edge function `get-streamer-pricing/index.ts`:

**Request:** `POST { streamer_slug: "ankit", currency: "USD" }`

**Response:**
```json
{
  "minText": 1,
  "minTts": 1,
  "minVoice": 3,
  "minHypersound": 1,
  "minMedia": 2,
  "ttsEnabled": true,
  "currency": "USD"
}
```

### Step 4: Update Donation Pages

Modify `Ankit.tsx`, `ChiaaGaming.tsx`, `LooteriyaGaming.tsx` to fetch minimums from API:

```typescript
useEffect(() => {
  const fetchPricing = async () => {
    const { data } = await supabase.functions.invoke('get-streamer-pricing', {
      body: { streamer_slug: 'ankit', currency: selectedCurrency }
    });
    if (data) setMinimums(data);
  };
  fetchPricing();
}, [selectedCurrency]);
```

---

## Files to Modify

| File | Change |
|------|--------|
| **Database** | Add 4 columns via migration |
| `create-razorpay-order-unified/index.ts` | Fetch DB values, apply MAX() + auto-rounding, validate TTS vs text |
| **New** `get-streamer-pricing/index.ts` | API for frontend to fetch minimums |
| `supabase/config.toml` | Register new edge function |
| `Ankit.tsx`, `ChiaaGaming.tsx`, `LooteriyaGaming.tsx` | Fetch minimums from API |
| `src/constants/currencies.ts` | Add `roundToNice()` utility |

---

## Admin Workflow

To change a streamer's minimums in Supabase Dashboard:

| Column | Description | NULL behavior |
|--------|-------------|---------------|
| `min_text_amount_inr` | Plain text minimum | Uses 40 INR |
| `min_tts_amount_inr` | TTS-enabled text minimum | Uses 40 INR |
| `min_voice_amount_inr` | Voice recording minimum | Uses 150 INR |
| `min_hypersound_amount_inr` | HyperSound minimum | Uses 30 INR |
| `media_min_amount` | Media upload minimum | Uses 100 INR |

---

## Auto-Rounding Examples

| Streamer sets | Donor currency | Raw conversion | Final (rounded) |
|---------------|----------------|----------------|-----------------|
| TTS: 80 INR | USD | $0.90 | $1.00 |
| Voice: 200 INR | USD | $2.25 | $2.50 |
| Voice: 200 INR | AED | 8.3 | 9 AED |
| Text: 45 INR | INR | 45 | 50 INR |

