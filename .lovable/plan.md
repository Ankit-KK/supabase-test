

# Fix: Frontend Display Amounts and Dynamic TTS Threshold

## Issues Identified

1. **Ankit.tsx (line 520)**: Text minimum shows `pricing.ttsEnabled ? pricing.minTts : pricing.minText` instead of `pricing.minText`
2. **Ankit.tsx (line 600)**: Amount placeholder shows same incorrect logic
3. **Ankit.tsx (line 613)**: TTS threshold is hardcoded as `TTS above ₹70` - needs to use `pricing.minTts`
4. **ChiaaGaming.tsx (lines 437-439)**: TTS threshold hardcoded as `TTS above {symbol}{INR ? "70" : "1"}`
5. **LooteriyaGaming.tsx (lines 439-441)**: Same hardcoded TTS threshold issue
6. **DonationPageWrapper.tsx (line 67-75)**: Uses `getCurrencyMinimums(currency)` from constants instead of fetching from backend via `useStreamerPricing`

---

## Files to Modify

### 1. `src/pages/Ankit.tsx`

**Line 520** - Fix text minimum display:
```typescript
// BEFORE
<div className="text-[9px] text-yellow-300 drop-shadow-sm">Min: {getCurrencySymbol(formData.currency)}{pricing.ttsEnabled ? pricing.minTts : pricing.minText}</div>

// AFTER
<div className="text-[9px] text-yellow-300 drop-shadow-sm">Min: {getCurrencySymbol(formData.currency)}{pricing.minText}</div>
```

**Line 600** - Fix amount placeholder:
```typescript
// BEFORE
placeholder={donationType === 'message' ? `Min: ${pricing.ttsEnabled ? pricing.minTts : pricing.minText}` : ...}

// AFTER
placeholder={donationType === 'message' ? `Min: ${pricing.minText}` : ...}
```

**Line 613** - Make TTS threshold dynamic:
```typescript
// BEFORE
{formData.currency === 'INR' && donationType === 'message' && <p className="text-xs text-white/90 drop-shadow-sm">TTS above ₹70</p>}

// AFTER
{donationType === 'message' && pricing.ttsEnabled && (
  <p className="text-xs text-white/90 drop-shadow-sm">
    TTS above {getCurrencySymbol(formData.currency)}{pricing.minTts}
  </p>
)}
```

### 2. `src/pages/ChiaaGaming.tsx`

**Lines 436-439** - Make TTS threshold dynamic:
```typescript
// BEFORE
<p className="text-xs text-muted-foreground">
  TTS above {currencySymbol}
  {selectedCurrency === "INR" ? "70" : "1"}
</p>

// AFTER
{pricing.ttsEnabled && (
  <p className="text-xs text-muted-foreground">
    TTS above {currencySymbol}{pricing.minTts}
  </p>
)}
```

### 3. `src/pages/LooteriyaGaming.tsx`

**Lines 439-442** - Make TTS threshold dynamic:
```typescript
// BEFORE
<p className="text-xs text-muted-foreground">
  TTS in Riya's Voice above {currencySymbol}
  {selectedCurrency === "INR" ? "70" : "1"}
</p>

// AFTER
{pricing.ttsEnabled && (
  <p className="text-xs text-muted-foreground">
    TTS in Riya's Voice above {currencySymbol}{pricing.minTts}
  </p>
)}
```

### 4. `src/components/donation/DonationPageWrapper.tsx`

Update to use `useStreamerPricing` hook instead of hardcoded `getCurrencyMinimums`:

```typescript
// Add import
import { useStreamerPricing } from '@/hooks/useStreamerPricing';

// Inside component, replace getMinAmount with hook-based pricing
const { pricing } = useStreamerPricing(config.streamerSlug, currency);

const getMinAmount = () => {
  switch (donationType) {
    case 'text': return pricing.minText;
    case 'voice': return pricing.minVoice;
    case 'hypersound': return pricing.minHypersound;
    case 'media': return pricing.minMedia;
    default: return pricing.minText;
  }
};
```

---

## Summary

| File | Issue | Fix |
|------|-------|-----|
| `Ankit.tsx` | Text min shows `minTts` | Use `pricing.minText` |
| `Ankit.tsx` | TTS threshold hardcoded `₹70` | Use `pricing.minTts` |
| `ChiaaGaming.tsx` | TTS threshold hardcoded | Use `pricing.minTts` |
| `LooteriyaGaming.tsx` | TTS threshold hardcoded | Use `pricing.minTts` |
| `DonationPageWrapper.tsx` | Uses hardcoded constants | Use `useStreamerPricing` hook |

## Result After Fix

- Text donation minimum will show the correct `minText` value from database
- TTS threshold will dynamically show the `minTts` value from database  
- All currencies will display correctly rounded values from the backend
- Streamers can control both values independently via database

