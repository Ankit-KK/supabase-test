
# Per-Streamer Pricing in Unified Payment System

## Current Architecture

| Layer | Location | Current State |
|-------|----------|---------------|
| **Edge Function** | `create-razorpay-order-unified` | Hardcoded `CURRENCY_MINIMUMS` object (same for all streamers) |
| **Database** | `streamers` table | Already has `media_min_amount`, `hyperemotes_min_amount` columns |
| **Frontend** | `src/constants/currencies.ts` | Hardcoded minimums per currency (same for all streamers) |

## Solution: Database-Driven Pricing

Instead of hardcoded minimums, the edge function will **query the streamer's pricing settings from the database**.

### Database Schema Changes

Add new columns to the `streamers` table for all pricing tiers:

```sql
ALTER TABLE streamers
ADD COLUMN IF NOT EXISTS min_text_amount_inr numeric DEFAULT 40,
ADD COLUMN IF NOT EXISTS min_voice_amount_inr numeric DEFAULT 150,
ADD COLUMN IF NOT EXISTS min_hypersound_amount_inr numeric DEFAULT 30;
-- media_min_amount already exists
```

### Edge Function Changes

**File:** `supabase/functions/create-razorpay-order-unified/index.ts`

The function already queries the streamer:
```typescript
const { data: streamerData } = await supabase
  .from('streamers')
  .select('id, streamer_name')  // Currently fetches minimal data
  .eq('streamer_slug', streamer_slug)
  .single();
```

Update to fetch pricing settings:
```typescript
const { data: streamerData } = await supabase
  .from('streamers')
  .select('id, streamer_name, min_text_amount_inr, min_voice_amount_inr, min_hypersound_amount_inr, media_min_amount')
  .eq('streamer_slug', streamer_slug)
  .single();

// Use streamer-specific minimums (in INR) with currency conversion
const streamerMinimumsINR = {
  minText: streamerData.min_text_amount_inr || 40,
  minVoice: streamerData.min_voice_amount_inr || 150,
  minHypersound: streamerData.min_hypersound_amount_inr || 30,
  minMedia: streamerData.media_min_amount || 100,
};

// Convert to user's currency using exchange rates
const rate = EXCHANGE_RATES_TO_INR[currency] || 1;
const minimums = {
  minText: Math.ceil(streamerMinimumsINR.minText / rate),
  minVoice: Math.ceil(streamerMinimumsINR.minVoice / rate),
  minHypersound: Math.ceil(streamerMinimumsINR.minHypersound / rate),
  minMedia: Math.ceil(streamerMinimumsINR.minMedia / rate),
};
```

### Frontend Changes (Optional - For Display)

If the frontend needs to show minimum amounts before payment, create an edge function:

**File:** `supabase/functions/get-streamer-pricing/index.ts`
```typescript
// Returns streamer-specific minimums converted to requested currency
{
  minText: 40,
  minVoice: 150,
  minHypersound: 30,
  minMedia: 100,
  currency: 'INR'
}
```

---

## Implementation Steps

### Step 1: Database Migration
Add pricing columns to `streamers` table with sensible defaults

### Step 2: Update Unified Edge Function
Modify `create-razorpay-order-unified` to:
1. Fetch pricing settings from database
2. Apply currency conversion
3. Use fetched values for validation

### Step 3: (Optional) Frontend API
Create `get-streamer-pricing` for donation pages to display correct minimums

---

## Example: Different Pricing Per Streamer

After implementation, you can set in the database:

| Streamer | min_text_inr | min_voice_inr | min_hypersound_inr | media_min_amount |
|----------|--------------|---------------|--------------------|--------------------|
| Ankit | 40 | 150 | 30 | 100 |
| Chiaa Gaming | 50 | 200 | 40 | 150 |
| Looteriya Gaming | 30 | 100 | 25 | 80 |

The edge function automatically converts to the donor's currency using exchange rates.

---

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add 3 new columns to `streamers` table |
| `create-razorpay-order-unified/index.ts` | Fetch pricing from DB, apply currency conversion |
| (Optional) New edge function | `get-streamer-pricing` for frontend display |

---

## Key Benefits

1. **No code changes needed** to adjust pricing - just update database values
2. **Backward compatible** - defaults match current hardcoded values
3. **Currency conversion handled** - streamers set prices in INR, system converts automatically
4. **Dashboard manageable** - can add UI to settings panel later
