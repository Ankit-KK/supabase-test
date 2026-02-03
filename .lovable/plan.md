

# Fix: Clear Voice Recording When Amount Drops Below Tier

## Problem

When a user:
1. Enters ₹700 (gets 15s max duration)
2. Records a 15-second voice message
3. Changes amount to ₹150 (which only allows 8s max)

The 15-second recording persists, defeating the tiered system. Users could exploit this to get longer recordings than their donation amount allows.

---

## Solution

Add a `useEffect` that monitors `currentAmount` changes and clears the recording if:
1. A recording exists (`audioBlob` is present)
2. The recorded duration exceeds the new tier's max duration

---

## Files to Modify

### 1. `src/components/EnhancedVoiceRecorder.tsx`

Add a new `useEffect` to detect tier changes and clear recording if needed:

```typescript
// Add after line 54 (after the existing useEffect)

// Clear recording if user reduces amount below their recording's tier
useEffect(() => {
  if (audioBlob && duration > effectiveMaxDuration) {
    console.log(`[VoiceRecorder] Recording duration (${duration}s) exceeds new tier limit (${effectiveMaxDuration}s). Clearing.`);
    clearRecording();
  }
}, [currentAmount, effectiveMaxDuration, audioBlob, duration, clearRecording]);
```

### 2. `src/components/VoiceRecorder.tsx`

Same fix - add a `useEffect` to detect when recording exceeds allowed duration:

```typescript
// Add helper function at top of file (before component)
const getMaxDurationForAmount = (amount: number): number => {
  if (amount >= 500) return 15;
  if (amount >= 300) return 12;
  return 8;
};

// Inside component, add after line 42 (after existing useEffect)
const effectiveMaxDuration = maxDurationSeconds ?? getMaxDurationForAmount(currentAmount);

// Clear recording if user reduces amount below their recording's tier
useEffect(() => {
  if (audioBlob && duration > effectiveMaxDuration) {
    console.log(`[VoiceRecorder] Recording duration (${duration}s) exceeds new tier limit (${effectiveMaxDuration}s). Clearing.`);
    clearRecording();
  }
}, [currentAmount, effectiveMaxDuration, audioBlob, duration, clearRecording]);
```

---

## What This Fixes

| Scenario | Before | After |
|----------|--------|-------|
| User records 15s at ₹700, then changes to ₹150 | Recording persists (exploit) | Recording cleared, must re-record |
| User records 8s at ₹150, then changes to ₹500 | Recording persists | Recording persists (allowed) |
| User records 12s at ₹400, then changes to ₹200 | Recording persists (exploit) | Recording cleared |

---

## User Experience

When the recording is cleared due to tier change, the user will see:
- The recording disappears
- The "Start Recording" button reappears
- The tier description updates to show the new limit

This is the expected behavior - if you want a longer recording, you need to pay more.

