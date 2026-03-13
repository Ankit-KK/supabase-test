

# Update ADD_NEW_STREAMER.md — Post-Security-Lockdown

The existing guide at `docs/ADD_NEW_STREAMER.md` is thorough but outdated after the recent donation table lockdown. Three corrections are needed:

## Changes

### 1. Step 1 SQL — Remove public SELECT policy and public view
Lines 73-91 create a public SELECT policy and a `_donations_public` view. Both were removed in the lockdown migration. The SQL should only have:
- `ENABLE ROW LEVEL SECURITY`
- Service role ALL policy (keep existing)
- **Remove** the `Anyone can view approved...` SELECT policy
- **Remove** the `CREATE VIEW` block
- Add a comment explaining why no public access exists

### 2. Add new Steps for `get-leaderboard-data` and `get-goal-progress` edge functions
These were created in the lockdown and contain hardcoded `ALLOWED_TABLES` maps. A new streamer must be added to both:

- **`get-leaderboard-data`**: Add `'[SLUG]': '[SLUG]_donations'` to `ALLOWED_TABLES`
- **`get-goal-progress`**: Add `'[SLUG]': '[SLUG]_donations'` to `ALLOWED_TABLES`

Insert these as new steps after the current Step 7 (moderate-donation), shifting subsequent step numbers.

### 3. Update Quick Checklist
Add two new checklist items for the new edge functions. Remove mention of `_donations_public` view from Step 1 checklist item.

### 4. Add to "Edge Functions That Do NOT Need Changes" note
No additions needed — both new functions require manual mapping.

## Files Modified
- `docs/ADD_NEW_STREAMER.md` — three edits (SQL block, new steps, checklist)

