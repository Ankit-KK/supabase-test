

# Fetch Character Tiers from Database for All Streamers

## Overview

Currently, character limits are hardcoded in each donation page (ClumsyGod has `getMaxMessageLength`, Ankit has `getCharacterLimit`). Wolfy, ChiaaGaming, and LooteriyaGaming have no character limits at all. This change makes the frontend dynamically fetch `message_char_tiers` from the database via the existing `get-streamer-pricing` edge function.

## Current State

| Streamer | Character Limits | Source |
|---|---|---|
| ClumsyGod | 70 / 150 / 200 | Hardcoded in component |
| Ankit | 100 / 200 / 250 | Hardcoded in component |
| ChiaaGaming | None | No limit enforced |
| LooteriyaGaming | None | No limit enforced |
| Wolfy | None | No limit enforced |

## Changes

### 1. Edge Function: `get-streamer-pricing/index.ts`

- Add `message_char_tiers` to the `.select()` query (line 57)
- Include it in the response JSON so the frontend receives the tiers

### 2. Hook: `src/hooks/useStreamerPricing.ts`

- Add `messageCharTiers` to the `StreamerPricing` interface as `Array<{ min_amount: number; max_chars: number }> | null`
- Map it from the API response (default `null`)

### 3. Create utility: `src/utils/getMaxMessageLength.ts`

- A shared helper function that takes `(tiers, amountInCurrentCurrency)` and returns the max character count
- When tiers is `null`, returns a generous default (e.g., 500) so streamers without tiers configured are unaffected

### 4. Frontend Pages

**ClumsyGod.tsx:**
- Remove the hardcoded `getMaxMessageLength` function
- Import and use the shared utility with `pricing.messageCharTiers`

**Ankit.tsx:**
- Remove the hardcoded `getCharacterLimit` function
- Import and use the shared utility with `pricing.messageCharTiers`

**ChiaaGaming.tsx, LooteriyaGaming.tsx, Wolfy.tsx:**
- Add `maxLength` and character counter to the textarea using the shared utility
- These pages will only show limits when the streamer has tiers configured in the database

### 5. Database: Set tiers for Ankit

Run a migration to populate Ankit's existing tiers:

```sql
UPDATE public.streamers
SET message_char_tiers = '[{"min_amount":0,"max_chars":100},{"min_amount":100,"max_chars":200},{"min_amount":200,"max_chars":250}]'::jsonb
WHERE streamer_slug = 'ankit';
```

Clumsy God is already set. Other streamers remain `null` (no tiered limits).

## Technical Details

- The `message_char_tiers` column uses INR amounts as thresholds. Since `get-streamer-pricing` already handles currency conversion, the tiers will need to be converted using the same exchange rates. The converted thresholds will be included in the response so the frontend can compare directly against the user's entered amount.
- No existing edge functions or pages beyond those listed are touched
- The backend validation in `create-razorpay-order-unified` remains the authoritative enforcement; the frontend is just for UX
- The shared utility keeps all pages consistent and avoids duplicated logic

