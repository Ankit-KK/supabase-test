

## Plan: Add Two New Streamers — W Era and Mr Champion

### Overview

Add two new streamers following the exact same pattern as existing streamers (e.g., Brigzard). Each streamer requires: a database table, config registry entry, donation page, dashboard page, OBS alerts/goal overlay pages, media source player page, and mappings in all edge functions.

### Streamer Details

| Property | W Era | Mr Champion |
|---|---|---|
| Slug | `w_era` | `mr_champion` |
| Display Name | W Era | Mr Champion |
| Table | `w_era_donations` | `mr_champion_donations` |
| Brand Color | `#3b82f6` (Blue) | `#eab308` (Gold) |
| Razorpay Prefix | `we_rp_` | `mc_rp_` |
| Pusher Channels | `w_era-dashboard`, `w_era-goal`, `w_era-audio`, `w_era-alerts`, `w_era-settings` | `mr_champion-dashboard`, `mr_champion-goal`, `mr_champion-audio`, `mr_champion-alerts`, `mr_champion-settings` |

---

### Step 1: Database Migration

Create two new donation tables (`w_era_donations`, `mr_champion_donations`) with the same schema as `brigzard_donations`, plus RLS policies (SELECT for approved donations, ALL for service role). Also insert rows into the `streamers` table for each.

### Step 2: Config Registry

**File:** `src/config/streamers.ts`

Add `w_era` and `mr_champion` entries to `STREAMER_CONFIGS` with all Pusher channel names, brand color, table name, and prefix.

### Step 3: Donation Pages (Frontend)

Create two new files cloned from Brigzard's pattern:

- **`src/pages/WEra.tsx`** — identical structure to `Brigzard.tsx` but with:
  - `streamer_slug: "w_era"`, display name "W Era", brand color `#3b82f6`, gradient theme adjusted to blue
- **`src/pages/MrChampion.tsx`** — identical structure but with:
  - `streamer_slug: "mr_champion"`, display name "Mr Champion", brand color `#eab308`, gradient theme adjusted to gold

### Step 4: Dashboard Pages

- **`src/pages/dashboard/WEraDashboard.tsx`** — uses `StreamerDashboardWrapper` with `STREAMER_CONFIGS.w_era`
- **`src/pages/dashboard/MrChampionDashboard.tsx`** — uses `StreamerDashboardWrapper` with `STREAMER_CONFIGS.mr_champion`

### Step 5: OBS Alert Pages

- **`src/pages/obs-alerts/WEraObsAlerts.tsx`** — `ObsAlertsWrapper` with slug `w_era`
- **`src/pages/obs-alerts/WEraGoalOverlay.tsx`** — `GoalOverlayWrapper` with slug `w_era`
- **`src/pages/obs-alerts/MrChampionObsAlerts.tsx`** — `ObsAlertsWrapper` with slug `mr_champion`
- **`src/pages/obs-alerts/MrChampionGoalOverlay.tsx`** — `GoalOverlayWrapper` with slug `mr_champion`

### Step 6: Media Source Player Pages

- **`src/pages/audio-player/WEraMediaSourcePlayer.tsx`** — `MediaSourcePlayer` with slug, name, table, path, color
- **`src/pages/audio-player/MrChampionMediaSourcePlayer.tsx`** — same pattern

### Step 7: App.tsx Routes

Add all new routes:
- `/w_era`, `/mr_champion` (donation pages)
- `/dashboard/w_era`, `/dashboard/mr_champion`
- `/w_era/obs-alerts`, `/w_era/goal-overlay`, `/mr_champion/obs-alerts`, `/mr_champion/goal-overlay`
- `/w_era/media-audio-player`, `/mr_champion/media-audio-player`

### Step 8: Edge Function Updates

All edge functions need the new streamer mappings added. No logic changes, just adding entries to existing maps:

1. **`supabase/functions/create-razorpay-order-unified/index.ts`** — Add `w_era` and `mr_champion` to `STREAMER_CONFIG`
2. **`supabase/functions/check-payment-status-unified/index.ts`** — Add to `STREAMER_CONFIG`
3. **`supabase/functions/notify-new-donations/index.ts`** — Add `w_era_donations` and `mr_champion_donations` to `donationTables` array
4. **`supabase/functions/generate-donation-tts/index.ts`** — Add to `donationTableMap`
5. **`supabase/functions/get-current-audio/index.ts`** — Add to `STREAMER_TABLE_MAP` and `STREAMER_CHANNEL_MAP`

### Step 9: Status.tsx Updates

**File:** `src/pages/Status.tsx`

- Add `we_rp_` and `mc_rp_` prefix checks in `getCheckPaymentFunction` (both route to `check-payment-status-unified`)
- Add `we_rp_` and `mc_rp_` prefix checks in `getBackLink` (route to `/w_era` and `/mr_champion`)

### Step 10: Deploy Edge Functions

Redeploy all 5 updated edge functions:
- `create-razorpay-order-unified`
- `check-payment-status-unified`
- `notify-new-donations`
- `generate-donation-tts`
- `get-current-audio`

---

### Summary of New Files (10 files)

1. `src/pages/WEra.tsx`
2. `src/pages/MrChampion.tsx`
3. `src/pages/dashboard/WEraDashboard.tsx`
4. `src/pages/dashboard/MrChampionDashboard.tsx`
5. `src/pages/obs-alerts/WEraObsAlerts.tsx`
6. `src/pages/obs-alerts/WEraGoalOverlay.tsx`
7. `src/pages/obs-alerts/MrChampionObsAlerts.tsx`
8. `src/pages/obs-alerts/MrChampionGoalOverlay.tsx`
9. `src/pages/audio-player/WEraMediaSourcePlayer.tsx`
10. `src/pages/audio-player/MrChampionMediaSourcePlayer.tsx`

### Summary of Modified Files (8 files)

1. `src/config/streamers.ts` — add 2 config entries
2. `src/App.tsx` — add imports + routes
3. `src/pages/Status.tsx` — add prefix mappings
4. `supabase/functions/create-razorpay-order-unified/index.ts` — add 2 entries
5. `supabase/functions/check-payment-status-unified/index.ts` — add 2 entries
6. `supabase/functions/notify-new-donations/index.ts` — add 2 tables
7. `supabase/functions/generate-donation-tts/index.ts` — add 2 entries
8. `supabase/functions/get-current-audio/index.ts` — add 2 entries each to TABLE_MAP and CHANNEL_MAP

### Database Migration

1 migration creating 2 tables + RLS policies + 2 streamer inserts.
