
# Plan: Add New Streamer "Wolfy"

This plan outlines all changes required to fully integrate a new streamer named "Wolfy" into the platform. The integration follows the existing unified architecture pattern established for other streamers.

---

## Summary

Adding Wolfy requires changes across 3 areas:
1. **Database** - Create donation table and register streamer
2. **Backend** - Update 6 edge functions with streamer mappings
3. **Frontend** - Create 6 React pages and add routes

---

## Step 1: Database Setup (Run in Supabase SQL Editor)

### 1.1 Create Donation Table

```sql
CREATE TABLE wolfy_donations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id uuid REFERENCES streamers(id),
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

-- Enable RLS
ALTER TABLE wolfy_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (match other streamers)
CREATE POLICY "Anyone can create donations" ON wolfy_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view approved donations" ON wolfy_donations FOR SELECT
  USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');
CREATE POLICY "Service role can manage all donations" ON wolfy_donations FOR ALL
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');
```

### 1.2 Register Streamer

```sql
INSERT INTO streamers (
  streamer_slug, 
  streamer_name, 
  brand_color,
  min_text_amount_inr,
  min_tts_amount_inr,
  min_voice_amount_inr,
  min_hypersound_amount_inr,
  media_min_amount,
  tts_enabled,
  moderation_mode,
  pusher_group
) VALUES (
  'wolfy',
  'Wolfy',
  '#f59e0b',  -- Amber/orange color
  40,   -- min text
  70,   -- min TTS
  150,  -- min voice
  30,   -- min hypersound
  100,  -- min media
  true,
  'auto_approve',
  1     -- Pusher group
);
```

---

## Step 2: Backend Edge Function Updates

### 2.1 `create-razorpay-order-unified/index.ts`

Add to STREAMER_CONFIG (line ~14):
```typescript
'wolfy': { table: 'wolfy_donations', prefix: 'wf_rp_' },
```

### 2.2 `check-payment-status-unified/index.ts`

Add to STREAMER_CONFIG (line ~24):
```typescript
'wolfy': { table: 'wolfy_donations', prefix: 'wf_rp_' },
```

### 2.3 `razorpay-webhook/index.ts`

Add to streamerSlugMap (line ~21):
```typescript
'wolfy': 'wolfy',
```

Add table lookup block (after clumsy_god check, ~line 245):
```typescript
// Try wolfy
const wolfyResult = await supabase
  .from('wolfy_donations')
  .select('*')
  .eq('razorpay_order_id', razorpayOrderId)
  .maybeSingle();

if (wolfyResult.data) {
  donation = wolfyResult.data;
  streamerType = 'wolfy';
  tableName = 'wolfy_donations';
}
```

Update streamerType type (line ~189):
```typescript
let streamerType: 'ankit' | 'looteriyagaming' | 'chiagaming' | 'clumsygod' | 'wolfy'
```

### 2.4 `get-current-audio/index.ts`

Add to both maps (lines ~10-21):
```typescript
// STREAMER_TABLE_MAP
'wolfy': 'wolfy_donations',

// STREAMER_CHANNEL_MAP
'wolfy': 'wolfy-alerts',
```

### 2.5 `generate-donation-tts/index.ts`

Add to donationTableMap (line ~228):
```typescript
wolfy: "wolfy_donations",
```

### 2.6 `get-streamer-pricing/index.ts`

No changes needed - automatically pulls from streamers table by slug.

---

## Step 3: Frontend Configuration Updates

### 3.1 `src/config/streamers.ts`

Add Wolfy config:
```typescript
wolfy: {
  slug: 'wolfy',
  name: 'Wolfy',
  tableName: 'wolfy_donations',
  brandColor: '#f59e0b',
  pusherDashboardChannel: 'wolfy-dashboard',
  pusherGoalChannel: 'wolfy-goal',
  pusherAudioChannel: 'wolfy-audio',
  pusherAlertsChannel: 'wolfy-alerts',
  pusherSettingsChannel: 'wolfy-settings',
  razorpayOrderPrefix: 'wf_rp_',
},
```

### 3.2 `src/config/donationPageConfigs.ts`

Add Wolfy donation page config:
```typescript
wolfy: {
  streamerSlug: 'wolfy',
  streamerName: 'Wolfy',
  brandColor: '#f59e0b',
  logoSrc: '/assets/streamers/wolfy-logo.png',
  backgroundSrc: '/assets/streamers/wolfy-background.png',
  edgeFunctionName: 'create-razorpay-order-unified',
  themeDescription: 'Support Wolfy with your donation',
},
```

---

## Step 4: Create Frontend Pages

### 4.1 Donation Page: `src/pages/Wolfy.tsx`

Copy from ClumsyGod.tsx and update:
- Replace all "clumsy_god" with "wolfy"
- Replace all "Clumsy God" with "Wolfy"
- Update brand color from `#a855f7` to `#f59e0b`
- Update gradient theme to amber/orange tones

### 4.2 Dashboard: `src/pages/dashboard/WolfyDashboard.tsx`

```typescript
import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.wolfy;

const WolfyDashboard = () => {
  return (
    <StreamerDashboardWrapper
      streamerSlug={config.slug}
      streamerName={config.name}
      tableName={config.tableName}
      brandColor={config.brandColor}
    />
  );
};

export default WolfyDashboard;
```

### 4.3 OBS Alerts: `src/pages/obs-alerts/WolfyObsAlerts.tsx`

```typescript
import { ObsAlertsWrapper } from '@/components/obs/ObsAlertsWrapper';

const WolfyObsAlerts = () => {
  return <ObsAlertsWrapper streamerSlug="wolfy" storagePrefix="wolfy" />;
};

export default WolfyObsAlerts;
```

### 4.4 Goal Overlay: `src/pages/obs-alerts/WolfyGoalOverlay.tsx`

```typescript
import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const WolfyGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="wolfy" />
    </div>
  );
};

export default WolfyGoalOverlay;
```

### 4.5 Media Source Player: `src/pages/audio-player/WolfyMediaSourcePlayer.tsx`

```typescript
import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Dog } from 'lucide-react';

const WolfyMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="wolfy"
    streamerName="Wolfy"
    tableName="wolfy_donations"
    browserSourcePath="/wolfy/audio-player"
    brandColor="#f59e0b"
    Icon={Dog}
  />
);

export default WolfyMediaSourcePlayer;
```

---

## Step 5: Update App Router

### `src/App.tsx`

Add imports:
```typescript
import Wolfy from "./pages/Wolfy";
import WolfyDashboard from "./pages/dashboard/WolfyDashboard";
import WolfyObsAlerts from "./pages/obs-alerts/WolfyObsAlerts";
import WolfyGoalOverlay from "./pages/obs-alerts/WolfyGoalOverlay";
import WolfyMediaSourcePlayer from "./pages/audio-player/WolfyMediaSourcePlayer";
```

Add routes:
```typescript
{/* Wolfy routes */}
<Route path="/wolfy" element={<Wolfy />} />
<Route path="/dashboard/wolfy" element={<WolfyDashboard />} />
<Route path="/wolfy/obs-alerts" element={<WolfyObsAlerts />} />
<Route path="/wolfy/goal-overlay" element={<WolfyGoalOverlay />} />
<Route path="/wolfy/media-audio-player" element={<WolfyMediaSourcePlayer />} />
```

---

## Step 6: Update Status Page

### `src/pages/Status.tsx`

Add Wolfy prefix handling:

In `getCheckPaymentFunction` (line ~98):
```typescript
if (orderId.startsWith('wf_rp_')) return 'check-payment-status-unified';
```

In `getBackLink` (line ~224):
```typescript
if (orderId.startsWith('wf_rp_')) return "/wolfy";
```

---

## Step 7: Assets (Optional)

Upload to `public/assets/streamers/`:
- `wolfy-logo.png` - Streamer logo
- `wolfy-background.png` - Page background (or .mp4 for video)

---

## Technical Summary

| Component | Change |
|-----------|--------|
| Database | 1 new table + 1 streamers row |
| Edge Functions | 5 functions updated with mappings |
| Frontend Config | 2 config files updated |
| React Pages | 5 new page components |
| App Router | 5 new routes + imports |
| Status Page | 2 prefix mappings added |

---

## Order Prefix

**Wolfy's order prefix:** `wf_rp_`

This is unique and follows the naming pattern of other streamers.

---

## Verification Checklist

After implementation:
1. Test donation page at `/wolfy`
2. Make a test donation and verify payment flow
3. Check Status page redirects correctly
4. Verify OBS alerts at `/wolfy/obs-alerts`
5. Test Media Source player at `/wolfy/media-audio-player`
6. Confirm dashboard access at `/dashboard/wolfy`
