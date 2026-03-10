# Adding a New Streamer — Complete Guide

Replace these placeholders throughout:

| Placeholder | Example | Description |
|---|---|---|
| `[SLUG]` | `shadow_x` | Snake_case identifier (used everywhere) |
| `[NAME]` | `ShadowX` | Display name |
| `[COLOR]` | `#ff6b35` | Brand hex color |
| `[PREFIX]` | `sx_rp_` | Razorpay order prefix (unique, 2-3 chars + `_rp_`) |
| `[TABLE_ID]` | `11` | Next smallint — see "How to pick TABLE_ID" below |
| `[PASCAL]` | `ShadowX` | PascalCase for component names |
| `[LOGO_FILE]` | `shadow-x-logo.png` | Logo filename (kebab-case) |
| `[BG_FILE]` | `shadow-x-background.png` | Background filename |

### How to pick `[TABLE_ID]`

Open `src/config/streamers.ts` → find `DONATION_TABLE_ID_MAP`. The current highest key is `10` (demigod). Use the next integer: **`11`**. After adding, update this note for the next person.

Current mapping (as of March 2026):
```
0=ankit, 1=chiaa_gaming, 2=looteriya_gaming, 3=clumsy_god, 4=wolfy,
5=dorp_plays, 6=zishu, 7=brigzard, 8=w_era, 9=mr_champion, 10=demigod
```

### How to pick `[PREFIX]`

Must be unique across all streamers. Check `STREAMER_CONFIGS` in `src/config/streamers.ts` for existing prefixes. Format: 2-3 letter abbreviation + `_rp_` (e.g., `sx_rp_`).

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

> **Note:** `amount_inr` is included in the table creation. It is populated automatically by `create-razorpay-order-unified` at order creation time and by `razorpay-webhook` / `check-payment-status-unified` at payment confirmation time. No separate migration needed.

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

> **Deployment:** Edge functions auto-deploy on save in Lovable. If editing outside Lovable, deploy manually via `supabase functions deploy create-razorpay-order-unified`.

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

> ⚠️ **Without this, the Media Source audio player and OBS alerts will NOT work.**

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

## STEP 9: Frontend — `src/config/donationPageConfigs.ts` (optional)

> **Note:** This config file exists but is **not used by any current donation page**. All pages are standalone. You may add an entry here for future reference, but it has no functional effect.

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

All streamer donation pages are standalone custom pages (~375 lines each). There is no shared wrapper component — each page is self-contained.

**Copy `src/pages/Demigod.tsx` → `src/pages/[PASCAL].tsx`**, then make these replacements:

| Line(s) | What | Find (Demigod value) | Replace with |
|---|---|---|---|
| 23 | Component declaration | `const Demigod` | `const [PASCAL]` |
| 43 | Pricing hook slug | `"demigod"` | `"[SLUG]"` |
| 161 | Voice upload slug | `streamerSlug: "demigod"` | `streamerSlug: "[SLUG]"` |
| 168-169 | Order creation slug | `streamer_slug: "demigod"` | `streamer_slug: "[SLUG]"` |
| 189 | Razorpay checkout name | `name: "Demigod"` | `name: "[NAME]"` |
| 190 | Razorpay description | `description: "Support Demigod"` | `description: "Support [NAME]"` |
| 195 | Razorpay theme color | `color: "#ac1117"` | `color: "[COLOR]"` |
| 210 | Card title text | `Demigod` | `[NAME]` |
| 213 | Subtitle text | `Support Demigod with your donation` | `Support [NAME] with your donation` |
| 338 | Voice recorder prop | `brandColor="#ac1117"` | `brandColor="[COLOR]"` |
| 348 | Media uploader slug | `streamerSlug="demigod"` | `streamerSlug="[SLUG]"` |
| 370 | Footer prop | `brandColor="#ac1117"` | `brandColor="[COLOR]"` |
| 377 | Export statement | `export default Demigod` | `export default [PASCAL]` |

**Hardcoded color classes to replace (Demigod's palette):**

| Hex | Usage | Occurrences | Replace with |
|---|---|---|---|
| `#24201D` | Dark background, input bg | 4 (lines 205, 206, 207, 222, 303) | Your dark bg color |
| `#3D4158` | Card border, input border, type button border | 7 (lines 206, 223, 233, 236, 266, 303, 322) | Your border color |
| `#AC1117` / `#ac1117` | Brand accent (buttons, focus rings, active borders) | 7 (lines 195, 234, 236, 303, 338, 363, 370) | `[COLOR]` |
| `#8e0e13` | Button hover state | 1 (line 363) | Darker variant of `[COLOR]` |
| `#EDE7E7` | Primary text color | 5 (lines 210, 218, 224, 260, 266, 303, 322, 363, 367) | Your text color |
| `#7E797D` | Muted/placeholder text | 3 (lines 213, 223, 303, 322) | Your muted text color |

**No images/logos are referenced inside Demigod.tsx** — it uses no logo image. If you want a logo at the top of the card, add an `<img>` tag inside `CardHeader` manually.

---

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

> **`storagePrefix` convention:** Use the slug as-is (snake_case). The only exception in the codebase is `chiaa-gaming` (kebab-case, legacy). All newer streamers use their slug directly: `ankit`, `demigod`, `wolfy`, `dorp_plays`, `mr_champion`, `w_era`, `brigzard`, `zishu`, `clumsy_god`, `looteriya_gaming`.

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

Add routes (inside `<Routes>`):

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

> **Only needed if using Option A (DonationPageWrapper)**. Option B (standalone) doesn't reference external logo/background files unless you add them manually.

---

## STEP 14: Link Streamer Account (after signup)

After the streamer creates their account at `/auth`:

```sql
-- Get the auth_users UUID from the DB after they sign up
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

## Edge Function Deployment

- **In Lovable:** Edge functions auto-deploy when files are saved. No manual step needed.
- **Outside Lovable:** Run `supabase functions deploy <function-name>` for each modified function (Steps 3-7).

---

## Quick Checklist

- [ ] SQL: Create `[SLUG]_donations` table + RLS + view (includes `amount_inr` column)
- [ ] SQL: INSERT into `streamers`
- [ ] Edge: `create-razorpay-order-unified` → `STREAMER_CONFIG`
- [ ] Edge: `check-payment-status-unified` → `STREAMER_CONFIG`
- [ ] Edge: `get-current-audio` → `STREAMER_TABLE_MAP` + `STREAMER_CHANNEL_MAP`
- [ ] Edge: `razorpay-webhook` → `DONATION_TABLE_ID_MAP` + `TABLE_TO_SLUG`
- [ ] Edge: `moderate-donation` → `ALLOWED_DONATION_TABLES`
- [ ] Frontend: `src/config/streamers.ts` → `STREAMER_CONFIGS` + `DONATION_TABLE_ID_MAP`
- [ ] Frontend: `src/config/donationPageConfigs.ts` → optional registry entry
- [ ] Pages: Donation (copy Demigod.tsx), Dashboard, OBS Alerts, Goal Overlay, Audio Player
- [ ] Routes: 5 entries in `src/App.tsx`
- [ ] Status: Prefix mapping in `Status.tsx` (2 functions)
- [ ] Assets: Logo + background in `public/assets/streamers/` (optional, not referenced by default template)
- [ ] Post-signup: Link `user_id` in `streamers` + `auth_users`
- [ ] Verify: Edge functions deployed (auto in Lovable, manual outside)
