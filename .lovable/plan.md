

## Add New Streamer: BRIGZARD

A complete end-to-end integration for a new streamer called "BRIGZARD" with a Call of Duty military/tactical color theme (olive green, dark khaki, gunmetal).

### Theme Colors
- **Primary brand color**: `#4a5c3e` (military olive green)
- **Accent**: `#c4a747` (gold/khaki)
- **Dark background tones** with tactical/military feel

---

### 1. Database Setup

**Create `brigzard_donations` table** with the same schema as all other donation tables (matching `zishu_donations` exactly):

Columns: `id`, `name`, `amount`, `currency`, `message`, `voice_message_url`, `temp_voice_data`, `tts_audio_url`, `hypersound_url`, `media_url`, `media_type`, `order_id`, `razorpay_order_id`, `payment_status`, `moderation_status`, `approved_by`, `approved_at`, `is_hyperemote`, `streamer_id`, `message_visible`, `mod_notified`, `audio_played_at`, `audio_scheduled_at`, `created_at`, `updated_at`

**RLS policies** (same pattern as all other streamers):
- RESTRICTIVE SELECT: only approved + success donations visible to public
- RESTRICTIVE ALL for service_role: `USING (true) WITH CHECK (true)`
- No public INSERT (donations only via edge functions)

**Create `brigzard_donations_public` view** (read-only view of approved donations, matching the pattern of other `_public` views).

**Insert streamer record** into `streamers` table:
```sql
INSERT INTO streamers (streamer_slug, streamer_name, brand_color, moderation_mode, min_text_amount_inr)
VALUES ('brigzard', 'BRIGZARD', '#4a5c3e', 'auto_approve', 40);
```

**Grant table permissions**:
```sql
GRANT SELECT ON brigzard_donations TO anon, authenticated;
```

---

### 2. Frontend Config Updates

**`src/config/streamers.ts`** -- Add brigzard entry:
- slug: `brigzard`
- tableName: `brigzard_donations`
- brandColor: `#4a5c3e`
- prefix: `bz_rp_`
- Pusher channels: `brigzard-dashboard`, `brigzard-goal`, `brigzard-audio`, `brigzard-alerts`, `brigzard-settings`

**`src/config/donationPageConfigs.ts`** -- Add brigzard donation page config with logo/background paths.

---

### 3. Edge Function Updates (mapping additions only, no logic changes)

Each of these files needs a single line added to their streamer maps:

| Edge Function | Map to Update | Entry to Add |
|---|---|---|
| `create-razorpay-order-unified` | `STREAMER_CONFIG` | `'brigzard': { table: 'brigzard_donations', prefix: 'bz_rp_' }` |
| `check-payment-status-unified` | `STREAMER_CONFIG` | Same as above |
| `razorpay-webhook` | `streamerSlugMap` + table search chain | `'brigzard': 'brigzard'` + add `brigzard_donations` lookup |
| `generate-donation-tts` | `donationTableMap` | `brigzard: 'brigzard_donations'` |
| `get-current-audio` | `STREAMER_TABLE_MAP` + `STREAMER_CHANNEL_MAP` | `'brigzard': 'brigzard_donations'` / `'brigzard': 'brigzard-alerts'` |
| `get-streamer-pricing` | No change needed (reads from `streamers` table dynamically) |

---

### 4. Frontend Pages (6 new files, all following Zishu pattern)

**`src/pages/Brigzard.tsx`** -- Donation page
- Cloned from Zishu.tsx
- Military/CoD theme: dark olive background, gold accents, tactical font styling
- `streamer_slug: "brigzard"`, brand color `#4a5c3e`, accent `#c4a747`
- Border colors use olive/gold instead of purple

**`src/pages/dashboard/BrigzardDashboard.tsx`** -- Dashboard wrapper (3 lines, same as ZishuDashboard)

**`src/pages/obs-alerts/BrigzardObsAlerts.tsx`** -- OBS alerts (3 lines)

**`src/pages/obs-alerts/BrigzardGoalOverlay.tsx`** -- Goal overlay (5 lines)

**`src/pages/audio-player/BrigzardMediaSourcePlayer.tsx`** -- Media source player (7 lines)

---

### 5. Route Registration (`src/App.tsx`)

Add imports and routes:
- `/brigzard` -- donation page
- `/dashboard/brigzard` -- dashboard
- `/brigzard/obs-alerts` -- OBS alerts
- `/brigzard/goal-overlay` -- goal overlay
- `/brigzard/media-audio-player` -- media source player

---

### 6. Status Page Update (`src/pages/Status.tsx`)

Add two mappings:
- `getCheckPaymentFunction`: `if (orderId.startsWith('bz_rp_')) return 'check-payment-status-unified';`
- `getBackLink`: `if (orderId.startsWith('bz_rp_')) return "/brigzard";`

---

### 7. Assets Needed

Placeholder paths (you will need to upload actual images):
- `/assets/streamers/brigzard-logo.png`
- `/assets/streamers/brigzard-background.png`

Until uploaded, the page will show the CoD-themed CSS gradient as fallback.

---

### Summary of All Files Changed

| File | Action |
|---|---|
| Database migration (new table + RLS + streamer row) | Create |
| `src/config/streamers.ts` | Edit (add entry) |
| `src/config/donationPageConfigs.ts` | Edit (add entry) |
| `src/pages/Brigzard.tsx` | Create |
| `src/pages/dashboard/BrigzardDashboard.tsx` | Create |
| `src/pages/obs-alerts/BrigzardObsAlerts.tsx` | Create |
| `src/pages/obs-alerts/BrigzardGoalOverlay.tsx` | Create |
| `src/pages/audio-player/BrigzardMediaSourcePlayer.tsx` | Create |
| `src/App.tsx` | Edit (add imports + routes) |
| `src/pages/Status.tsx` | Edit (add prefix mappings) |
| `supabase/functions/create-razorpay-order-unified/index.ts` | Edit (add to STREAMER_CONFIG) |
| `supabase/functions/check-payment-status-unified/index.ts` | Edit (add to STREAMER_CONFIG) |
| `supabase/functions/razorpay-webhook/index.ts` | Edit (add to slugMap + table search) |
| `supabase/functions/generate-donation-tts/index.ts` | Edit (add to donationTableMap) |
| `supabase/functions/get-current-audio/index.ts` | Edit (add to both maps) |

No existing streamer pages, dashboards, or edge function logic will be modified -- only map entries are appended.

