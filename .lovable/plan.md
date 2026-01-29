

# Bug Fix: TTS Minimum Incorrectly Used for All Text Donations

## Problem Identified

When `tts_enabled = true` for a streamer, the current code uses `minTts` as the minimum for ALL text donations. This is incorrect because:

- Ankit has `min_tts_amount_inr = 50` in the database
- The frontend shows "Min: 50" for text messages
- But text donations under ₹70 are plain text (no TTS), so they should use `minText` (40)

**Current database state for Ankit:**
| Column | Value |
|--------|-------|
| `min_text_amount_inr` | NULL (uses platform floor 40) |
| `min_tts_amount_inr` | 50 |
| `tts_enabled` | true |

**What happens now:**
- Text donation minimum shown: ₹50 (wrong - should be ₹40)
- TTS only kicks in at ₹70+, so ₹40-69 donations are plain text

## The Fix

The minimum for text donations should be `minText`, not `minTts`, because:
1. Users can donate below the TTS threshold (₹70) to send plain text
2. The `minTts` is the minimum required to get TTS, not the minimum to send any text

### Files to Modify

**1. `src/pages/Ankit.tsx`** - Fix validation and display logic:

```typescript
// BEFORE (incorrect):
const textMin = pricing.ttsEnabled ? pricing.minTts : pricing.minText;

// AFTER (correct):
// Text donations use minText - TTS is a bonus at higher amounts
const textMin = pricing.minText;
```

Also update placeholder display:
```typescript
// BEFORE:
placeholder={donationType === 'message' ? `Min: ${pricing.ttsEnabled ? pricing.minTts : pricing.minText}` : ...}

// AFTER:
placeholder={donationType === 'message' ? `Min: ${pricing.minText}` : ...}
```

**2. `src/pages/ChiaaGaming.tsx`** - Same fix

**3. `src/pages/LooteriyaGaming.tsx`** - Same fix

**4. `supabase/functions/create-razorpay-order-unified/index.ts`** - Fix backend validation:

```typescript
// BEFORE (incorrect):
if (!hypersoundUrl && !voiceMessageUrl && !mediaUrl) {
  const requiredMin = streamerData.tts_enabled ? minimums.minTts : minimums.minText;
  if (amount < requiredMin) {
    throw new Error(`Text messages require minimum ${currency} ${requiredMin}`);
  }
}

// AFTER (correct):
if (!hypersoundUrl && !voiceMessageUrl && !mediaUrl) {
  // Text donations always use minText - TTS is a bonus at higher amounts
  if (amount < minimums.minText) {
    throw new Error(`Text messages require minimum ${currency} ${minimums.minText}`);
  }
}
```

## Summary of Changes

| File | Change |
|------|--------|
| `Ankit.tsx` | Use `pricing.minText` for text donations |
| `ChiaaGaming.tsx` | Use `pricing.minText` for text donations |
| `LooteriyaGaming.tsx` | Use `pricing.minText` for text donations |
| `create-razorpay-order-unified` | Use `minimums.minText` for text validation |

## Result After Fix

For Ankit with database values:
- `min_text_amount_inr = NULL` → Platform floor 40 INR
- `min_tts_amount_inr = 50` → Not used for minimum validation

**User experience:**
- Text donation minimum: ₹40
- Donations ₹40-69: Plain text only
- Donations ₹70+: Gets TTS audio

The `minTts` column can now be used for **informational purposes** (e.g., "Donate ₹50+ for TTS") or for future features where you want to control the TTS threshold, but it won't incorrectly raise the base text donation minimum.

