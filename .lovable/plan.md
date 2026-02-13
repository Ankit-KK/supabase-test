

# Fix: Update Looteriya Gaming Goal Activation Date

## What happened
An attacker deactivated the goal for Looteriya Gaming. We need to restore it with the correct activation date.

## Change
Update the `streamers` table for `looteriya_gaming` with:
- `goal_activated_at` = `2025-12-23 18:53:22+00`
- `goal_is_active` = `true` (ensure it stays active)

This is a single SQL UPDATE using the insert/update tool (data operation, not schema change):

```sql
UPDATE streamers
SET goal_activated_at = '2025-12-23 18:53:22+00',
    goal_is_active = true
WHERE streamer_slug = 'looteriya_gaming';
```

This will restore the goal overlay showing approximately 7,602 INR progress toward the 18,500 INR StreamDeck target.

