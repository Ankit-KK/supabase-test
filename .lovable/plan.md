

# Egress Reduction Plan - Updated with Tiered Voice Recording

## Executive Summary

This plan implements 7 targeted changes to reduce egress costs by 70-80% while introducing **tiered voice recording durations** based on donation amount. The goal is to reduce average egress per donation from ~150-500 KB to ~30-50 KB without any UX regression.

---

## Voice Recording Duration Tiers (User Requested)

| Donation Amount (INR) | Max Recording Duration |
|-----------------------|------------------------|
| ₹150 - ₹299 | 8 seconds |
| ₹300 - ₹499 | 12 seconds |
| ₹500+ | 15 seconds |

This tiered approach rewards higher donations with longer voice messages while significantly reducing egress from voice recordings.

---

## Current State Analysis

| Component | Current Implementation | Egress Impact |
|-----------|----------------------|---------------|
| **TTS Audio** | MP3 @ 128 kbps, 32 kHz, mono | ~150-300 KB per 8-15s audio |
| **Voice Messages** | WebM/Opus, max 60s | Up to 450+ KB per message |
| **Media Source** | 302 redirect to R2 URL (good) | Single download per audio |
| **Replay** | Available in moderation panel | Each replay re-downloads |
| **Dashboard Preview** | `<audio controls>` element | Silent egress multiplier |

---

## 1. Tiered Voice Recording Duration (Primary Change)

### Problem
Voice recorder allows up to 60 seconds, which at browser default bitrate = ~450+ KB per message.

### Solution
Implement dynamic duration based on donation amount:

**File: `src/components/EnhancedVoiceRecorder.tsx`**

```typescript
// Add helper function to calculate max duration based on amount
const getMaxDurationForAmount = (amount: number): number => {
  if (amount >= 500) return 15;
  if (amount >= 300) return 12;
  return 8; // Default for 150-299
};
```

Update the component to:
1. Accept `currentAmount` (already passed)
2. Calculate dynamic `maxDuration` based on amount
3. Display appropriate messaging to user

**Key Changes:**
- Replace static `maxDurationSeconds = 60` default with dynamic calculation
- Update UI to show tier-specific duration message
- Clear any existing recording if user changes amount to lower tier

**File: `src/hooks/useVoiceRecorder.ts`**
- Already supports dynamic `maxDurationSeconds` prop via ref update (line 32-35)
- No changes needed to hook

**Donation Page Files to Update:**
- `src/components/donation/DonationPageWrapper.tsx`
- `src/pages/ChiaaGaming.tsx`
- `src/pages/LooteriyaGaming.tsx`
- `src/pages/ClumsyGod.tsx`
- `src/pages/Wolfy.tsx`

Each needs to pass calculated `maxDurationSeconds` based on `currentAmount`.

---

## 2. Audio Format Optimization (TTS)

### Problem
TTS uses MiniMax API with: 128 kbps, 32 kHz = ~160 KB per 10s.

### Solution
Change TTS parameters for smaller files:

**File: `supabase/functions/generate-donation-tts/index.ts`**

```typescript
// Lines 336-343: Change audio settings
audio_setting: {
  sample_rate: 24000,    // Was 32000
  bitrate: 32000,        // Was 128000
  format: "mp3",         // Keep MP3 for OBS compatibility
  channel: 1,
}
```

**Note:** Keeping MP3 format for maximum OBS Media Source compatibility. Lower bitrate still sounds excellent for speech.

**Expected result: 10-second audio = ~40 KB (4x reduction)**

---

## 3. Replay Limit/Warning

### Problem
Each replay re-downloads full audio from R2.

### Solution
Add confirmation dialog before replay:

**File: `src/components/dashboard/moderation/ModerationPanel.tsx`**

Before the `moderateDonation('replay', ...)` call, show confirmation:

```typescript
// Add warning before replay
const handleReplay = async (donationId: string) => {
  const confirmed = window.confirm(
    'Replay will re-download the audio from the server. Continue?'
  );
  if (confirmed) {
    await moderateDonation('replay', donationId);
  }
};
```

---

## 4. Dashboard Preview Warning

### Problem
Moderators playing audio previews = silent R2 egress.

### Solution
Add visual warning that preview uses data:

**File: `src/components/dashboard/DonationCard.tsx`**

Add hint near audio player:

```tsx
{donation.voice_message_url && (
  <div className="mb-3">
    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
      <Mic className="h-4 w-4" />
      <span>Voice Message</span>
      <span className="text-xs text-yellow-600">(preview uses data)</span>
    </div>
    <MiniAudioPlayer audioUrl={donation.voice_message_url} />
  </div>
)}
```

---

## 5. Lock Media Source URL Pattern

### Current State (Already Good)
`get-current-audio` uses 302 redirect to static R2 URLs.

### Action
Add documentation comment to prevent regression:

**File: `supabase/functions/get-current-audio/index.ts`**

```typescript
// CRITICAL: Do NOT change to signed URLs or add query params.
// Media Source works best with static URLs. See egress-reduction plan.
return new Response(null, {
  status: 302,
  headers: {
    'Location': audioUrl,  // Static R2 URL - DO NOT MODIFY
    ...
  },
});
```

---

## 6. Add Egress Logging (Monitoring)

### Problem
No visibility into per-donation egress.

### Solution
Add structured logging:

**File: `supabase/functions/get-current-audio/index.ts`**

```typescript
// After serving audio, log for monitoring
console.log(JSON.stringify({
  event: 'audio_served',
  streamer: streamerSlug,
  donation_id: donation.id,
  audio_type: donation.voice_message_url ? 'voice' : 
              donation.hypersound_url ? 'hypersound' : 'tts',
  timestamp: new Date().toISOString()
}));
```

---

## 7. Optional: Per-Stream Audio Cap

### Problem
Long streams = unlimited egress potential.

### Recommendation
Add configurable limit (e.g., 200 audio donations per day).

**Implementation deferred** - Can add later based on monitoring data.

---

## Implementation Summary

| Priority | Item | Impact | Files |
|----------|------|--------|-------|
| P0 | Tiered voice duration (8/12/15s) | ~75% reduction in voice file sizes | EnhancedVoiceRecorder.tsx + 5 donation pages |
| P0 | TTS bitrate reduction (32kbps) | ~4x reduction in TTS sizes | generate-donation-tts/index.ts |
| P1 | Replay warning | Prevents accidental loops | ModerationPanel.tsx |
| P1 | Preview warning | User awareness | DonationCard.tsx |
| P2 | URL stability lock | Prevent regression | get-current-audio/index.ts |
| P2 | Egress logging | Visibility | get-current-audio/index.ts |

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Max voice message duration | 60 seconds | 15 seconds (₹500+) |
| Max voice file @ ₹150-299 | ~450 KB | ~60 KB (8s) |
| Max voice file @ ₹300-499 | ~450 KB | ~90 KB (12s) |
| Max voice file @ ₹500+ | ~450 KB | ~110 KB (15s) |
| Avg TTS file size | 150-300 KB | 30-50 KB |
| Replay egress | Unlimited | Warning + user consent |
| Dashboard preview | Hidden cost | User aware |

**Net result: 70-80% egress reduction without UX regression.**

---

## Files to Modify

### Frontend
- `src/components/EnhancedVoiceRecorder.tsx` - Add tiered duration logic + UI updates
- `src/components/donation/DonationPageWrapper.tsx` - Pass dynamic maxDuration
- `src/pages/ChiaaGaming.tsx` - Pass dynamic maxDuration
- `src/pages/LooteriyaGaming.tsx` - Pass dynamic maxDuration
- `src/pages/ClumsyGod.tsx` - Pass dynamic maxDuration
- `src/pages/Wolfy.tsx` - Pass dynamic maxDuration
- `src/components/dashboard/moderation/ModerationPanel.tsx` - Replay warning
- `src/components/dashboard/DonationCard.tsx` - Preview warning

### Backend
- `supabase/functions/generate-donation-tts/index.ts` - Reduce bitrate/sample rate
- `supabase/functions/get-current-audio/index.ts` - Lock URL pattern + egress logging

