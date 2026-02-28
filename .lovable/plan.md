

# Compact Rewards Banner with Info Tooltip

## Change
Replace the expanded banner with a single-line display showing only the title, plus an info icon button that reveals full details on click.

## New Layout

```
🎁 Earn Reward Points for Real Products  (i)
```

Clicking/tapping the (i) button shows a popover with:
- ₹1000 donation = 50 points
- Points apply only to donations ₹1000+
- Dynamic line: "This donation will earn: XXX points" or "No points earned"

## Technical Details

**File:** `src/components/RewardsBanner.tsx`

- Keep the same props (`amount`, `currency`) and points calculation logic
- Replace the multi-line card with a single flex row: Gift icon + title text + info Popover
- Use the existing `Popover` component (already used in Ankit.tsx for currency selector) to show details on click
- The popover content contains the rules and dynamic points line

**No other files changed** -- Ankit.tsx import and placement stays the same.

