

# Add Rewards Banner to Ankit Donation Page

## What
A compact, eye-catching banner on Ankit's donation page showing reward points earned per donation. Pure frontend -- no backend logic needed.

## Reward Rule
- 50 points per Rs.1000 donated (only for INR, only for amounts >= Rs.1000)
- Formula: `Math.floor(amount / 1000) * 50`
- Non-INR currencies or amounts below Rs.1000 show "No points earned"

## New Component: `RewardsBanner`

Create `src/components/RewardsBanner.tsx` -- a small, reusable component that takes `amount` (number) and `currency` (string).

**Display logic:**
- If currency is not INR or amount < 1000: show "No points earned"
- Otherwise: show calculated points

**Layout (matches the spec):**
```
+------------------------------------------+
| Gift  Earn Reward Points for Real Products |
|                                          |
| Rs.1000 donation = 50 points               |
| Points apply only to donations Rs.1000+    |
|                                          |
| This donation will earn: XXX points      |
+------------------------------------------+
```

**Styling:** Uses Ankit's existing blue/purple theme with a subtle gradient border, semi-transparent background (`bg-gradient-to-br from-yellow-500/10 to-orange-500/10`), gold/yellow accent text for points.

## Placement in `src/pages/Ankit.tsx`

Insert the banner directly above the Submit/Donate button (around line 701), so the user sees it right before confirming payment.

```tsx
<RewardsBanner amount={currentAmount} currency={formData.currency} />
```

## Files Changed
1. **New:** `src/components/RewardsBanner.tsx` -- the banner component
2. **Edit:** `src/pages/Ankit.tsx` -- import and place the banner above the donate button

## What Does NOT Change
- No other streamer pages modified
- No backend/edge functions changed
- No database changes

