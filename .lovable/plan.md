

# Add New Streamer: DorpPlays

## Overview
Add "DorpPlays" as the 6th active streamer on the platform, following the exact same architecture used for Wolfy and Clumsy God. This covers database, edge functions, frontend donation page, dashboard, OBS overlays, and audio player.

## Identifiers
- **Slug**: `dorp_plays`
- **Display Name**: DorpPlays
- **Table**: `dorp_plays_donations`
- **Order Prefix**: `dp2_rp_` (note: `dp_rp_` is reserved for legacy "Damask Plays" per the template doc, so we use `dp2_rp_`)
- **Brand Color**: `#6366f1` (indigo -- can be changed later via dashboard settings)

---

## Step-by-Step Implementation

### 1. Database Migration
Create the `dorp_plays_donations` table with the exact same schema as `wolfy_donations` (25 columns). Enable RLS with no public insert/select policies (service_role only). Also insert a row into the `streamers` table for DorpPlays.

```sql
-- Create donation table
CREATE TABLE public.dorp_plays_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid REFERENCES public.streamers(id),
  name text NOT NULL,
  amount numeric NOT NULL,
  currency varchar DEFAULT 'INR',
  message text,
  voice_message_url text,
  temp_voice_data text,
  tts_audio_url text,
  hypersound_url text,
  is_hyperemote boolean DEFAULT false,
  media_url text,
  media_type text,
  order_id text,
  razorpay_order_id text,
  payment_status text DEFAULT 'pending',
  moderation_status text DEFAULT 'pending',
  approved_by text,
  approved_at timestamptz,
  mod_notified boolean DEFAULT false,
  message_visible boolean DEFAULT true,
  audio_scheduled_at timestamptz,
  audio_played_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.dorp_plays_donations ENABLE ROW LEVEL SECURITY;

-- Insert streamer record
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, tts_enabled, moderation_mode)
VALUES ('dorp_plays', 'DorpPlays', '#6366f1', true, 'none');
```

### 2. Edge Function Updates (no new functions needed)

All payment processing uses the unified architecture. The following files need a single-line addition each:

- **`create-razorpay-order-unified/index.ts`** -- Add `'dorp_plays': { table: 'dorp_plays_donations', prefix: 'dp2_rp_' }` to `STREAMER_CONFIG`.
- **`check-payment-status-unified/index.ts`** -- Add same entry to its `STREAMER_CONFIG`.
- **`razorpay-webhook/index.ts`** -- Add `'dorpplays': 'dorp_plays'` to `streamerSlugMap`, and add a new lookup block for `dorp_plays_donations` in the table scanning logic.
- **`get-current-audio/index.ts`** -- Add `'dorp_plays': 'dorp_plays_donations'` to `STREAMER_TABLE_MAP` and `'dorp_plays': 'dorp_plays-alerts'` to `STREAMER_CHANNEL_MAP`.

### 3. Frontend Config Updates

- **`src/config/streamers.ts`** -- Add `dorp_plays` entry to `STREAMER_CONFIGS` with all Pusher channel names.
- **`src/config/donationPageConfigs.ts`** -- Add `dorp_plays` entry with logo/background paths and `edgeFunctionName: 'create-razorpay-order-unified'`.

### 4. New Frontend Pages (7 files, all following existing patterns)

| File | Template |
|------|----------|
| `src/pages/DorpPlays.tsx` | Copy of `Wolfy.tsx` with slug/name/color swapped to `dorp_plays` / `DorpPlays` / indigo theme |
| `src/pages/dashboard/DorpPlaysDashboard.tsx` | 5-line wrapper using `STREAMER_CONFIGS.dorp_plays` |
| `src/pages/obs-alerts/DorpPlaysObsAlerts.tsx` | 3-line wrapper: `<ObsAlertsWrapper streamerSlug="dorp_plays" />` |
| `src/pages/obs-alerts/DorpPlaysGoalOverlay.tsx` | 5-line wrapper: `<GoalOverlayWrapper streamerSlug="dorp_plays" />` |
| `src/pages/audio-player/DorpPlaysMediaSourcePlayer.tsx` | 8-line wrapper using `MediaSourcePlayer` |

### 5. Route Registration (`src/App.tsx`)

Add the following routes:
- `/dorp_plays` -- Donation page
- `/dashboard/dorp_plays` -- Dashboard
- `/dorp_plays/obs-alerts` -- OBS Alert Box
- `/dorp_plays/goal-overlay` -- OBS Goal Overlay
- `/dorp_plays/media-audio-player` -- OBS Media Source Audio Player

### 6. Status Page Update (`src/pages/Status.tsx`)

- Add `dp2_rp_` prefix mapping in `getCheckPaymentFunction` (returns `'check-payment-status-unified'`)
- Add `dp2_rp_` prefix in `getBackLink` (returns `'/dorp_plays'`)

### 7. Supabase Config (`supabase/config.toml`)

No new edge functions are being created, so no config.toml changes needed.

### 8. Streamer Access

After deployment, a login account and `streamer_access` record will need to be created for DorpPlays to access their dashboard. This is an admin-side database operation.

---

## Technical Notes

- No existing streamer pages, edge functions, or database tables are modified (only additive changes to shared config maps).
- The unified edge functions (`create-razorpay-order-unified`, `check-payment-status-unified`) handle all payment logic -- no new edge functions required.
- The `razorpay-webhook` function scans tables sequentially; adding `dorp_plays_donations` as a new scan step is the established pattern.
- RLS is enabled with no public policies, matching all other donation tables (service_role only access).
- Brand color, pricing tiers, TTS settings, and moderation mode are all configurable from the dashboard after setup.

