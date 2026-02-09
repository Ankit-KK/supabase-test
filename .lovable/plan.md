

# Fix: Enforce Tiered Character Limits on Backend

## Problem

The Clumsy God donation page has tiered character limits (70/150/200 chars based on amount), but these are **only enforced in the frontend UI**. The backend (`create-razorpay-order-unified`) has no such validation, allowing users to bypass limits by editing the DOM or calling the API directly.

Evidence from the database:
- 2nd last donation: 50 INR with 166 characters (limit should be 70)
- Last 40 INR donation: 260 characters (limit should be 70)

## Solution

Add server-side message length validation in `create-razorpay-order-unified` for streamers that have tiered character limits.

### Step 1: Add a character limit config to the streamer table

Add a new column `message_char_tiers` (jsonb, nullable) to the `streamers` table. When set, it defines amount-based character limits. Example value for Clumsy God:

```json
[
  { "min_amount": 0, "max_chars": 70 },
  { "min_amount": 100, "max_chars": 150 },
  { "min_amount": 300, "max_chars": 200 }
]
```

When null (default for other streamers), no tiered limit is enforced beyond the existing 500-char sanitization cap.

### Step 2: Update `create-razorpay-order-unified`

- Fetch `message_char_tiers` in the streamer query
- If tiers exist, determine the max allowed length for the given amount (converted to INR) and reject if the message exceeds it
- Truncate or reject with a clear error message

### Step 3: Update `src/integrations/supabase/types.ts`

- Add `message_char_tiers` to the streamers type definition

### Step 4: Set the value for Clumsy God in the database

```sql
UPDATE public.streamers
SET message_char_tiers = '[{"min_amount":0,"max_chars":70},{"min_amount":100,"max_chars":150},{"min_amount":300,"max_chars":200}]'::jsonb
WHERE streamer_slug = 'clumsy_god';
```

### Step 5: Update frontend `ClumsyGod.tsx`

- Optionally fetch tiers from the pricing endpoint so the frontend stays in sync with the database rather than hardcoding values (future improvement, not strictly required now)

## Technical Details

- The validation uses INR-converted amounts so that currency conversion is consistent
- Other streamers are unaffected (null = no tiered limits)
- The existing 500-char `sanitizeInput` cap remains as a universal safety net
- No existing edge functions or pages are modified except `create-razorpay-order-unified`

