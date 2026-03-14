

# Fix: Migrate remaining direct donation table queries to edge functions

## Root Cause
The donation table lockdown removed all public SELECT policies, but 3 components still query those tables directly via the client. They silently return empty arrays — causing "No approved donations", "₹0 progress", and empty goal overlays.

## Changes Required

### 1. New edge function: `get-dashboard-donations`
Authenticated endpoint returning both stats and donation list for the dashboard.

- Input: `streamerSlug`, auth via `x-auth-token`
- Uses service_role to query the locked donation table
- Returns: `{ stats: { totalRevenue, todayRevenue, totalDonations, averageDonation, topDonation }, donations: [...] }`
- Auth: validate_session_token + owner/admin check (same pattern as get-goal-progress)

### 2. Update `get-goal-progress` to support public (OBS) access
Currently requires auth. The OBS goal overlay has no auth token.

- If `x-auth-token` is provided: validate session + owner/admin check (dashboard use)
- If no auth token but `streamerSlug` is provided: allow read-only access (OBS overlay use — public data, just a single number)
- Remove the requirement for `streamerId` when unauthenticated — look it up from `streamerSlug`

### 3. Update `StreamerDashboard.tsx`
Replace the two direct queries (fetchStats + fetchAllDonations) with a single call to `get-dashboard-donations`.

### 4. Update `GoalManager.tsx`
Replace the direct donation table query (lines 47-52) with a call to `get-goal-progress` edge function.

### 5. Update `GoalOverlayWrapper.tsx`
Replace the direct donation table query (lines 80-84) with a call to `get-goal-progress` (unauthenticated mode).

### 6. Config
Add `get-dashboard-donations` to `supabase/config.toml` with `verify_jwt = false`.

## Files

| File | Action |
|------|--------|
| `supabase/functions/get-dashboard-donations/index.ts` | Create — authenticated edge function |
| `supabase/functions/get-goal-progress/index.ts` | Edit — add unauthenticated OBS mode |
| `src/components/dashboard/StreamerDashboard.tsx` | Edit — use edge function instead of direct queries |
| `src/components/dashboard/GoalManager.tsx` | Edit — use get-goal-progress edge function |
| `src/components/obs/GoalOverlayWrapper.tsx` | Edit — use get-goal-progress edge function (no auth) |
| `supabase/config.toml` | Edit — add get-dashboard-donations |

