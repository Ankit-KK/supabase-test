

# Update Looteriya Gaming Goal Activation Date to ₹7,593

## Summary
Update `goal_activated_at` to `2025-12-13 16:43:46+00` so the goal progress shows exactly **₹7,593 / ₹18,500**.

## What changed
New donations and the deleted ₹200 test donation shifted the totals. Re-analysis found that setting the cutoff at `2025-12-13 16:43:46+00` includes exactly the right donations to sum to ₹7,593.

## Change
Single SQL UPDATE on the `streamers` table (data-only, no schema change):

```sql
UPDATE streamers
SET goal_activated_at = '2025-12-13 16:43:46+00'
WHERE streamer_slug = 'looteriya_gaming';
```

Also update the existing migration file to reflect the correct timestamp.

## Result
- Goal overlay will display: **₹7,593 / ₹18,500** (StreamDeck)
- `goal_is_active` remains `true` (already set)
- No other tables or pages are affected

