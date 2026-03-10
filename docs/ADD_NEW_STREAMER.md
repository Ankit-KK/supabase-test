# Adding a New Streamer — Complete Guide

Replace these placeholders throughout:

| Placeholder | Example | Description |
|---|---|---|
| `[SLUG]` | `shadow_x` | Snake_case identifier |
| `[NAME]` | `ShadowX` | Display name |
| `[COLOR]` | `#ff6b35` | Brand hex color |
| `[PREFIX]` | `sx_rp_` | Razorpay order prefix (unique, 2-3 chars + `_rp_`) |
| `[TABLE_ID]` | `11` | Next available smallint in `DONATION_TABLE_ID_MAP` |
| `[PASCAL]` | `ShadowX` | PascalCase for component names |
| `[LOGO_FILE]` | `shadow-x-logo.png` | Logo filename (kebab-case) |
| `[BG_FILE]` | `shadow-x-background.png` | Background filename |

---

## STEP 1: Database — Create Donations Table + RLS + View

```sql
CREATE TABLE public.[SLUG]_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL,
  amount_inr numeric,
  currency varchar DEFAULT 'INR',
  message text,
  voice_message_url text,
  temp_voice_data text,
  tts_audio_url text,
  hypersound_url text,
  media_url text,
  media_type text,
  order_id text,
  razorpay_order_id text,
  status_token_hash text,
  payment_status text DEFAULT 'pending',
  moderation_status text DEFAULT 'pending',
  is_hyperemote boolean DEFAULT false,
  message_visible boolean DEFAULT true,
  mod_notified boolean DEFAULT false,
  approved_by text,
  approved_at timestamptz,
  audio_scheduled_at timestamptz,
  audio_played_at timestamptz,
  streamer_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.[SLUG]_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved [SLUG] donations"
  ON public.[SLUG]_donations FOR SELECT TO anon, authenticated
  AS RESTRICTIVE USING (
    moderation_status IN ('approved', 'auto_approved')
    AND payment_status = 'success'
  );

CREATE POLICY "Service role can manage [SLUG] donations"
  ON public.[SLUG]_donations FOR ALL TO service_role
  AS RESTRICTIVE USING (true) WITH CHECK (true);

-- Public view
CREATE VIEW public.[SLUG]_donations_public
  WITH (security_invoker = on) AS
  SELECT id, name, amount, currency, message, message_visible,
         is_hyperemote, hypersound_url, tts_audio_url,
         voice_message_url, created_at
  FROM public.[SLUG]_donations;
```

---

## STEP 2: Database — Insert Streamer Record

```sql
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, user_id)
VALUES ('[SLUG]', '[NAME]', '[COLOR]', NULL);
```

---

## STEP 3: Edge Function — `create-razorpay-order-unified`

Add to `STREAMER_CONFIG` map (~line 10):

```typescript
'[SLUG]': { table: '[SLUG]_donations', prefix: '[PREFIX]', tableId: [TABLE_ID] },
```

---

## STEP 4: Edge Function — `check-payment-status-unified`

Add to `STREAMER_CONFIG` map (~line 20):

```typescript
'[SLUG]': { table: '[SLUG]_donations', prefix: '[PREFIX]' },
```

---

## STEP 5: Edge Function — `get-current-audio`

Add to `STREAMER_TABLE_MAP` (~line 10):

```typescript
'[SLUG]': '[SLUG]_donations',
```

Add to `STREAMER_CHANNEL_MAP` (~line 25):

```typescript
'[SLUG]': '[SLUG]-alerts',
```

> **Without this, the Media Source audio player and OBS alerts will NOT work.**

---

## STEP 6: Edge Function — `razorpay-webhook`

Add to `DONATION_TABLE_ID_MAP` (~line 18):

```typescript
[TABLE_ID]: '[SLUG]_donations',
```

Add to `TABLE_TO_SLUG` (~line 26):

```typescript
'[SLUG]_donations': '[SLUG]',
```

---

## STEP 7: Edge Function — `moderate-donation`

Add table name to `ALLOWED_DONATION_TABLES` array (~line 243):

```typescript
'[SLUG]_donations',
```

---

## STEP 8: Frontend — `src/config/streamers.ts`

### 8A: Add to `STREAMER_CONFIGS`

```typescript
[SLUG]: {
  slug: '[SLUG]', name: '[NAME]', tableName: '[SLUG]_donations', brandColor: '[COLOR]',
  pusherDashboardChannel: '[SLUG]-dashboard', pusherGoalChannel: '[SLUG]-goal',
  pusherAudioChannel: '[SLUG]-audio', pusherAlertsChannel: '[SLUG]-alerts',
  pusherSettingsChannel: '[SLUG]-settings', razorpayOrderPrefix: '[PREFIX]',
},
```

### 8B: Add to `DONATION_TABLE_ID_MAP`

```typescript
[TABLE_ID]: '[SLUG]_donations',
```

---

## STEP 9: Frontend — `src/config/donationPageConfigs.ts`

Add to `DONATION_PAGE_CONFIGS`:

```typescript
[SLUG]: {
  streamerSlug: '[SLUG]',
  streamerName: '[NAME]',
  brandColor: '[COLOR]',
  logoSrc: '/assets/streamers/[LOGO_FILE]',
  backgroundSrc: '/assets/streamers/[BG_FILE]',
  edgeFunctionName: 'create-razorpay-order-unified',
  themeDescription: 'Support [NAME] with your donation',
},
```

---

## STEP 10: Create 5 Page Files

### 10A: Donation Page — `src/pages/[PASCAL].tsx`

**Option A — Wrapper (recommended):**

```tsx
import { DonationPageWrapper } from '@/components/donation/DonationPageWrapper';
import { DONATION_PAGE_CONFIGS } from '@/config/donationPageConfigs';

const [PASCAL] = () => <DonationPageWrapper config={DONATION_PAGE_CONFIGS.[SLUG]} />;
export default [PASCAL];
```

**Option B — Standalone (custom UI):**
Copy `src/pages/Demigod.tsx`, replace all `demigod` → `[SLUG]`, `Demigod` → `[PASCAL]`, colors → `[COLOR]`.

### 10B: Dashboard — `src/pages/dashboard/[PASCAL]Dashboard.tsx`

```tsx
import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.[SLUG];

const [PASCAL]Dashboard = () => (
  <StreamerDashboardWrapper
    streamerSlug={config.slug}
    streamerName={config.name}
    tableName={config.tableName}
    brandColor={config.brandColor}
  />
);

export default [PASCAL]Dashboard;
```

### 10C: OBS Alerts — `src/pages/obs-alerts/[PASCAL]ObsAlerts.tsx`

```tsx
import { ObsAlertsWrapper } from '@/components/obs/ObsAlertsWrapper';

const [PASCAL]ObsAlerts = () => <ObsAlertsWrapper streamerSlug="[SLUG]" storagePrefix="[SLUG]" />;
export default [PASCAL]ObsAlerts;
```

### 10D: Goal Overlay — `src/pages/obs-alerts/[PASCAL]GoalOverlay.tsx`

```tsx
import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const [PASCAL]GoalOverlay = () => (
  <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
    <GoalOverlayWrapper streamerSlug="[SLUG]" />
  </div>
);

export default [PASCAL]GoalOverlay;
```

### 10E: Media Audio Player — `src/pages/audio-player/[PASCAL]MediaSourcePlayer.tsx`

```tsx
import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const [PASCAL]MediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="[SLUG]"
    streamerName="[NAME]"
    tableName="[SLUG]_donations"
    browserSourcePath="/[SLUG]/media-audio-player"
    brandColor="[COLOR]"
  />
);

export default [PASCAL]MediaSourcePlayer;
```

---

## STEP 11: Routes — `src/App.tsx`

Add imports:

```tsx
import [PASCAL] from "./pages/[PASCAL]";
import [PASCAL]Dashboard from "./pages/dashboard/[PASCAL]Dashboard";
import [PASCAL]ObsAlerts from "./pages/obs-alerts/[PASCAL]ObsAlerts";
import [PASCAL]GoalOverlay from "./pages/obs-alerts/[PASCAL]GoalOverlay";
import [PASCAL]MediaSourcePlayer from "./pages/audio-player/[PASCAL]MediaSourcePlayer";
```

Add routes:

```tsx
<Route path="/[SLUG]" element={<[PASCAL] />} />
<Route path="/dashboard/[SLUG]" element={<[PASCAL]Dashboard />} />
<Route path="/[SLUG]/obs-alerts" element={<[PASCAL]ObsAlerts />} />
<Route path="/[SLUG]/goal-overlay" element={<[PASCAL]GoalOverlay />} />
<Route path="/[SLUG]/media-audio-player" element={<[PASCAL]MediaSourcePlayer />} />
```

---

## STEP 12: Status Page — `src/pages/Status.tsx`

### 12A: `getCheckPaymentFunction` (~line 95)

```typescript
if (orderId.startsWith('[PREFIX]')) return 'check-payment-status-unified';
```

### 12B: `getBackLink` (~line 227)

```typescript
if (orderId.startsWith('[PREFIX]')) return "/[SLUG]";
```

---

## STEP 13: Assets

Place in `public/assets/streamers/`:

- `[LOGO_FILE]` — Streamer logo (PNG, transparent background recommended)
- `[BG_FILE]` — Background image (PNG/JPG) or video (MP4)

---

## STEP 14: Link Streamer Account (after signup)

After the streamer creates their account at `/auth`:

```sql
-- Get the auth_users UUID from the auth page or DB
UPDATE public.streamers
SET user_id = '<their-auth_users-uuid>'
WHERE streamer_slug = '[SLUG]';

UPDATE public.auth_users
SET streamer_id = (SELECT id FROM streamers WHERE streamer_slug = '[SLUG]')
WHERE id = '<their-auth_users-uuid>';
```

---

## Edge Functions That Do NOT Need Changes

These are fully dynamic and require no manual updates:

| Function | Why |
|---|---|
| `generate-donation-tts` | Receives table name from caller |
| `notify-new-donations` | Queries `streamers` table by `streamer_id` |
| `upload-donation-media` | Uses `streamer_slug` from request |
| `upload-voice-message-direct` | Uses `streamer_slug` from request |
| `discord-webhook` | Callback-based, fully dynamic |
| `telegram-webhook` | Callback-based, fully dynamic |
| `get-streamer-pricing` | Reads from `streamers` table dynamically |
| `transcribe-voice-sarvam` | Generic, no streamer-specific config |
| `setup-discord-webhook` | Uses `streamer_id` from request |
| `setup-telegram-webhook` | Uses `streamer_id` from request |

---

## Quick Checklist

- [ ] SQL: Create `[SLUG]_donations` table + RLS + view
- [ ] SQL: INSERT into `streamers`
- [ ] Edge: `create-razorpay-order-unified` → `STREAMER_CONFIG`
- [ ] Edge: `check-payment-status-unified` → `STREAMER_CONFIG`
- [ ] Edge: `get-current-audio` → `STREAMER_TABLE_MAP` + `STREAMER_CHANNEL_MAP`
- [ ] Edge: `razorpay-webhook` → `DONATION_TABLE_ID_MAP` + `TABLE_TO_SLUG`
- [ ] Edge: `moderate-donation` → `ALLOWED_DONATION_TABLES`
- [ ] Frontend: `src/config/streamers.ts` → `STREAMER_CONFIGS` + `DONATION_TABLE_ID_MAP`
- [ ] Frontend: `src/config/donationPageConfigs.ts` → `DONATION_PAGE_CONFIGS`
- [ ] Pages: Donation, Dashboard, OBS Alerts, Goal Overlay, Audio Player
- [ ] Routes: 5 entries in `src/App.tsx`
- [ ] Status: Prefix mapping in `Status.tsx` (2 functions)
- [ ] Assets: Logo + background in `public/assets/streamers/`
- [ ] Post-signup: Link `user_id` in `streamers` + `auth_users`
