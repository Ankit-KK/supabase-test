

# Lock Down Donation Tables — Remove Public Access

## Why
All donation inserts already go through edge functions (service_role). Real-time updates use Pusher, not Supabase Realtime. Only 2 client-side reads exist, and both can be moved to edge functions.

## Current Client-Side Reads to Migrate

### 1. `useLeaderboard.ts` (line 64-70)
- Queries donation tables for latest 5 approved donations
- Also queries `streamer_donator_totals` for top donator
- **Fix**: Create a new edge function `get-leaderboard-data` that returns both top donator and latest 5 donations. Update `useLeaderboard.ts` to call this function instead of querying tables directly.

### 2. `AnkitGoalManager.tsx` (line 45-55)
- Queries `ankit_donations` to sum amounts for goal progress
- **Fix**: Create a new edge function `get-goal-progress` that calculates and returns the goal progress. Update `AnkitGoalManager.tsx` to call this function instead.

## Database Changes (SQL Migration)

After migrating the 2 reads above:

1. **Drop all public SELECT policies** on all donation tables:
   - `ankit_donations`, `chiaa_gaming_donations`, `looteriya_gaming_donations`, `wolfy_donations`, `brigzard_donations`, `mr_champion_donations`, `nova_plays_donations`, `starlight_anya_donations`, `reyna_yadav_donations`
   
2. **Keep only service_role ALL policies** on each table.

3. **Drop unused `_donations_public` views** (none are queried from client code):
   - `ankit_donations_public`, `brigzard_donations_public`, `chiaa_gaming_donations_public`, `clumsy_god_donations_public`, `demigod_donations_public`, `dorp_plays_donations_public`, `looteriya_gaming_donations_public`, `nova_plays_donations_public`, `reyna_yadav_donations_public`, `starlight_anya_donations_public`, `zishu_donations_public`

4. **Revoke SELECT on `streamer_donator_totals`** from anon/authenticated (leaderboard will use edge function).

## New Edge Functions

### `get-leaderboard-data`
- Input: `streamerSlug`
- No auth required (public OBS widgets need this)
- Uses service_role to query `streamer_donator_totals` + donation table
- Returns `{ topDonator, latestDonations }`

### `get-goal-progress`
- Input: `streamerId`, `authToken`
- Auth required (dashboard only)
- Uses service_role to sum donations since goal activation
- Returns `{ currentProgress }`

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useLeaderboard.ts` | Replace direct Supabase queries with `get-leaderboard-data` edge function call |
| `src/components/dashboard/AnkitGoalManager.tsx` | Replace direct query with `get-goal-progress` edge function call |
| `supabase/functions/get-leaderboard-data/index.ts` | New edge function |
| `supabase/functions/get-goal-progress/index.ts` | New edge function |
| `supabase/config.toml` | Add both new functions with `verify_jwt = false` |
| SQL migration | Drop public SELECT policies, drop unused views, revoke grants |

## Result
Zero client-side access to donation tables. All data flows through edge functions with service_role. Tables become completely locked down to service_role only.

