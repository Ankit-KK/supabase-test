

## Plan: Add New Streamer "Demigod"

Slug: `demigod` | Brand color: `#8b5cf6` (purple) | Prefix: `dg_rp_` | Table ID: `10` | Minimalist page style (no avatar circle)

---

### 1. Database Migration

Create the `demigod_donations` table matching the standard schema (same columns as `mr_champion_donations`), plus a public view and a streamer record:

```sql
-- Create demigod_donations table
CREATE TABLE public.demigod_donations ( ... same columns as other donation tables ... );

-- Enable RLS
ALTER TABLE public.demigod_donations ENABLE ROW LEVEL SECURITY;

-- RLS policies (RESTRICTIVE, matching platform standard)
CREATE POLICY "Anyone can view approved demigod donations" ON public.demigod_donations
  FOR SELECT USING (moderation_status IN ('approved','auto_approved') AND payment_status = 'success');

CREATE POLICY "Service role can manage demigod donations" ON public.demigod_donations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public view (security_invoker)
CREATE VIEW public.demigod_donations_public WITH (security_invoker = on) AS
  SELECT id, name, amount, currency, message, message_visible, voice_message_url,
         tts_audio_url, hypersound_url, is_hyperemote, created_at
  FROM public.demigod_donations
  WHERE moderation_status IN ('approved','auto_approved') AND payment_status = 'success';

-- Insert streamer record
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, moderation_mode, ...)
  VALUES ('demigod', 'Demigod', '#8b5cf6', 'auto_approve', ...);
```

### 2. Auth Account

Insert a placeholder auth account for dashboard access:
```sql
INSERT INTO auth_users (email, password_hash, streamer_id, role)
  VALUES ('demigod@hyperchat.site', '<bcrypt_hash>', <streamer_id>, 'user');
```

Add the `streamer_id` link to the `auth_users` record.

### 3. Frontend Config Files

**`src/config/streamers.ts`** — Add `demigod` entry:
- slug: `demigod`, name: `Demigod`, tableName: `demigod_donations`, brandColor: `#8b5cf6`
- Pusher channels: `demigod-dashboard`, `demigod-goal`, `demigod-audio`, `demigod-alerts`, `demigod-settings`
- razorpayOrderPrefix: `dg_rp_`
- Add to `DONATION_TABLE_ID_MAP`: `10: 'demigod_donations'`

**`src/config/donationPageConfigs.ts`** — Add `demigod` entry with placeholder assets and `create-razorpay-order-unified` edge function.

### 4. Frontend Pages (7 new files)

All follow existing patterns exactly:

| File | Pattern from |
|------|-------------|
| `src/pages/Demigod.tsx` | `MrChampion.tsx` (minimalist, purple theme) |
| `src/pages/dashboard/DemigodDashboard.tsx` | `MrChampionDashboard.tsx` |
| `src/pages/obs-alerts/DemigodObsAlerts.tsx` | `WEraObsAlerts.tsx` |
| `src/pages/obs-alerts/DemigodGoalOverlay.tsx` | `WEraGoalOverlay.tsx` |
| `src/pages/audio-player/DemigodMediaSourcePlayer.tsx` | `MrChampionMediaSourcePlayer.tsx` |

### 5. Router (`src/App.tsx`)

Add all routes:
- `/demigod` — donation page
- `/dashboard/demigod` — dashboard
- `/demigod/obs-alerts`, `/demigod/goal-overlay` — OBS
- `/demigod/media-audio-player` — audio player

### 6. Edge Function Mappings (6 functions to update)

Each function gets `demigod` added to its streamer map:

| Edge Function | What to add |
|---|---|
| `create-razorpay-order-unified` | `'demigod': { table: 'demigod_donations', prefix: 'dg_rp_', tableId: 10 }` |
| `razorpay-webhook` | Add to `DONATION_TABLE_ID_MAP` (10), `TABLE_TO_SLUG` |
| `check-payment-status-unified` | Add demigod config entry |
| `generate-donation-tts` | Add to `donationTableMap` |
| `get-current-audio` | Add to `STREAMER_TABLE_MAP` and `STREAMER_CHANNEL_MAP` |
| `notify-new-donations` | Add `demigod_donations` to `donationTables` array |
| `moderate-donation` | Already works generically via streamer_slug |

### 7. Status Page (`src/pages/Status.tsx`)

Add `dg_rp_` prefix mapping:
- `getCheckPaymentFunction`: return `'check-payment-status-unified'`
- `getBackLink`: return `'/demigod'`

### 8. Deploy

Redeploy all 6 modified edge functions.

---

### Summary of all changes

- **1 DB migration** (table + RLS + view + streamer record)
- **1 data insert** (auth account)
- **2 config files** updated
- **5 new frontend files** created
- **2 existing frontend files** updated (App.tsx, Status.tsx)
- **6 edge functions** updated and redeployed

