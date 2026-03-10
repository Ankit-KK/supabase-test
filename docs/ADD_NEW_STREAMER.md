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

**Option A — DonationPageWrapper (recommended for standard UI):**

The wrapper component lives at `src/components/donation/DonationPageWrapper.tsx` (443 lines). It accepts a single prop:

```typescript
interface DonationPageWrapperProps {
  config: DonationPageConfig;  // from src/config/donationPageConfigs.ts
}
```

The `DonationPageConfig` interface (from `src/config/donationPageConfigs.ts`):
```typescript
interface DonationPageConfig {
  streamerSlug: string;      // Used for API calls, voice upload path, media upload
  streamerName: string;      // Displayed in UI, Razorpay checkout
  brandColor: string;        // Active button color, logo border, submit button
  logoSrc: string;           // Circular logo at top of page
  backgroundSrc: string;     // Full-page background image (CSS background-image)
  cardBackgroundSrc?: string; // Optional card background image
  edgeFunctionName: string;  // Always 'create-razorpay-order-unified' for new streamers
  themeDescription?: string; // Not used by wrapper (only in config registry)
  socialLinks?: { ... };     // Not used by wrapper currently
}
```

**What the wrapper handles automatically:**
- Razorpay SDK loading + checkout flow
- All 4 donation types (text, voice, hypersound, media)
- Voice recording with tiered durations (₹150-299=8s, ₹300-499=12s, ₹500+=15s)
- Currency selector with all supported currencies
- Streamer pricing via `useStreamerPricing` hook
- Status page navigation after payment
- Voice upload to Supabase storage
- HowItWorks dialog + DonationPageFooter

**The page file (3 lines):**

```tsx
import { DonationPageWrapper } from '@/components/donation/DonationPageWrapper';
import { DONATION_PAGE_CONFIGS } from '@/config/donationPageConfigs';

const [PASCAL] = () => <DonationPageWrapper config={DONATION_PAGE_CONFIGS.[SLUG]} />;
export default [PASCAL];
```

---

**Option B — Standalone page (custom UI like Demigod.tsx):**

Use this when the streamer needs a unique visual design (custom colors, layout, gradients). Here is exactly what to change in `Demigod.tsx` (375 lines):

Copy `src/pages/Demigod.tsx` → `src/pages/[PASCAL].tsx`, then make these replacements:

| Line(s) | What | Change from | Change to |
|---|---|---|---|
| 23 | Component name | `const Demigod` | `const [PASCAL]` |
| 43 | Pricing hook slug | `"demigod"` | `"[SLUG]"` |
| 161 | Voice upload slug | `streamerSlug: "demigod"` | `streamerSlug: "[SLUG]"` |
| 168-169 | Order function body | `streamer_slug: "demigod"` | `streamer_slug: "[SLUG]"` |
| 189 | Razorpay name | `"Demigod"` | `"[NAME]"` |
| 190 | Razorpay description | `"Support Demigod"` | `"Support [NAME]"` |
| 195 | Razorpay theme color | `"#ac1117"` | `"[COLOR]"` |
| 205 | Background color | `bg-[#24201D]` | Your bg color |
| 206 | Card gradient | `from-[#24201D] to-[#3D4158]` | Your gradient |
| 210-211 | Title + subtitle | `Demigod` | `[NAME]` |
| 213 | Subtitle text | `Support Demigod...` | `Support [NAME]...` |
| 338 | Voice recorder brandColor | `"#ac1117"` | `"[COLOR]"` |
| 348 | Media uploader slug | `"demigod"` | `"[SLUG]"` |
| 363 | Submit button colors | `bg-[#AC1117] hover:bg-[#8e0e13]` | Your colors |
| 370 | Footer brandColor | `"#ac1117"` | `"[COLOR]"` |
| 377 | Export name | `export default Demigod` | `export default [PASCAL]` |

**Hardcoded color classes to replace (Demigod's palette):**
- `#24201D` — dark background
- `#3D4158` — card/border gray
- `#AC1117` / `#ac1117` — brand red (buttons, focus rings, borders)
- `#8e0e13` — hover state for brand color
- `#EDE7E7` — light text
- `#7E797D` — muted text

**No images/logos are hardcoded inside Demigod.tsx** — it uses no logo image. If you want a logo, add it manually (the wrapper has one; standalone pages don't by default).

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
- [ ] Frontend: `src/config/donationPageConfigs.ts` → `DONATION_PAGE_CONFIGS`
- [ ] Pages: Donation, Dashboard, OBS Alerts, Goal Overlay, Audio Player
- [ ] Routes: 5 entries in `src/App.tsx`
- [ ] Status: Prefix mapping in `Status.tsx` (2 functions)
- [ ] Assets: Logo + background in `public/assets/streamers/` (Option A only)
- [ ] Post-signup: Link `user_id` in `streamers` + `auth_users`
- [ ] Verify: Edge functions deployed (auto in Lovable)
