

## Lower Text Minimum to 20 for Zishu

### The Problem
The `get-streamer-pricing` edge function enforces a platform-wide floor of 40 INR for text donations:
```
PLATFORM_FLOORS_INR = { text: 40, ... }
```
The formula is `MAX(40, streamer_custom)`, so setting Zishu's custom to 20 still yields 40.

### Recommended Solution: Lower the Platform Text Floor to 20

Since the platform floor is meant to be the absolute minimum the system allows, lowering it to 20 INR lets any streamer (including Zishu) set their text minimum as low as 20. Other streamers already have their own custom minimums in the database, so they won't be affected -- their `MAX(20, custom)` will still resolve to their existing values.

### Changes

**1. `supabase/functions/get-streamer-pricing/index.ts`** -- Change one value:
```
PLATFORM_FLOORS_INR = { text: 20, ... }  // was 40
```

**2. Database update** -- Set Zishu's custom text minimum:
```sql
UPDATE streamers SET min_text_amount_inr = 20 WHERE streamer_slug = 'zishu';
```

**3. `src/hooks/useStreamerPricing.ts`** -- Update the frontend fallback default from 40 to 20:
```
minText: 20  // was 40
```

### What stays the same
- All other streamers keep their current minimums (their custom values are >= 20 already)
- No changes to Zishu's donation page UI code
- No changes to order creation or payment validation logic
- The `create-razorpay-order-unified` function uses the same pricing logic, so it will accept 20 INR text donations for Zishu automatically

### Risk Check
Other streamers with `min_text_amount_inr` set to NULL or 0 would also get a floor of 20 instead of 40. If any streamer relies on the 40 floor, their `min_text_amount_inr` should be explicitly set to 40 in the database.
