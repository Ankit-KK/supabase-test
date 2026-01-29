
# Comprehensive Guide: Adding New Streamer "Clumsy God"

This guide covers all steps needed to add a new streamer from frontend to backend, following existing patterns and without touching any old streamers' functionality.

---

## Streamer Configuration Details

| Property | Value |
|----------|-------|
| Slug | `clumsy_god` |
| Display Name | Clumsy God |
| Table Name | `clumsy_god_donations` |
| Brand Color | `#10b981` (emerald green - suggested, can be changed) |
| Order Prefix | `cg2_rp_` (avoiding conflict with `cg_rp_` used by Chiaa Gaming) |
| Pusher Channels | `clumsy_god-dashboard`, `clumsy_god-goal`, `clumsy_god-audio`, `clumsy_god-alerts`, `clumsy_god-settings` |

---

## Phase 1: Database Setup

### 1.1 Create Donations Table

Create migration to add `clumsy_god_donations` table with same schema as other streamers:

```sql
-- Create clumsy_god_donations table
CREATE TABLE IF NOT EXISTS public.clumsy_god_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES public.streamers(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'INR',
  message TEXT,
  voice_message_url TEXT,
  hypersound_url TEXT,
  media_url TEXT,
  media_type TEXT,
  is_hyperemote BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  order_id TEXT,
  razorpay_order_id TEXT,
  temp_voice_data TEXT,
  tts_audio_url TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  message_visible BOOLEAN DEFAULT true,
  mod_notified BOOLEAN DEFAULT false,
  audio_scheduled_at TIMESTAMPTZ,
  audio_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clumsy_god_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as other streamers)
CREATE POLICY "Anyone can create donations" ON public.clumsy_god_donations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view approved donations" ON public.clumsy_god_donations
  FOR SELECT USING (
    moderation_status IN ('approved', 'auto_approved') 
    AND payment_status = 'success'
  );

CREATE POLICY "Service role can manage all donations" ON public.clumsy_god_donations
  FOR ALL USING (is_service_role()) WITH CHECK (is_service_role());

-- Create public view for leaderboard
CREATE OR REPLACE VIEW public.clumsy_god_donations_public AS
SELECT 
  id, name, amount, currency, message, message_visible,
  is_hyperemote, voice_message_url, hypersound_url, tts_audio_url, created_at
FROM public.clumsy_god_donations
WHERE moderation_status IN ('approved', 'auto_approved')
  AND payment_status = 'success';
```

### 1.2 Add Streamer Record

Insert streamer configuration into `streamers` table:

```sql
INSERT INTO public.streamers (
  streamer_slug,
  streamer_name,
  brand_color,
  moderation_mode,
  tts_enabled,
  telegram_moderation_enabled,
  hyperemotes_enabled,
  media_upload_enabled,
  media_moderation_enabled,
  pusher_group,
  goal_is_active,
  tts_voice_id
) VALUES (
  'clumsy_god',
  'Clumsy God',
  '#10b981',
  'auto_approve',
  true,
  true,
  true,
  true,
  true,
  1,
  false,
  'moss_audio_3e9334b7-e32a-11f0-ba34-ee3bcee0a7c9'
);
```

---

## Phase 2: Backend Edge Functions

### 2.1 Update Unified Payment Functions

**File: `supabase/functions/create-razorpay-order-unified/index.ts`**

Add to `STREAMER_CONFIG` map (around line 10-14):

```typescript
const STREAMER_CONFIG: Record<string, { table: string; prefix: string }> = {
  'ankit': { table: 'ankit_donations', prefix: 'ank_rp_' },
  'chiaa_gaming': { table: 'chiaa_gaming_donations', prefix: 'cg_rp_' },
  'looteriya_gaming': { table: 'looteriya_gaming_donations', prefix: 'lg_rp_' },
  'clumsy_god': { table: 'clumsy_god_donations', prefix: 'cg2_rp_' },  // NEW
};
```

**File: `supabase/functions/check-payment-status-unified/index.ts`**

Add to `STREAMER_CONFIG` map (around line 20-24):

```typescript
const STREAMER_CONFIG: Record<string, { table: string; prefix: string }> = {
  'ankit': { table: 'ankit_donations', prefix: 'ank_rp_' },
  'chiaa_gaming': { table: 'chiaa_gaming_donations', prefix: 'cg_rp_' },
  'looteriya_gaming': { table: 'looteriya_gaming_donations', prefix: 'lg_rp_' },
  'clumsy_god': { table: 'clumsy_god_donations', prefix: 'cg2_rp_' },  // NEW
};
```

### 2.2 Update Razorpay Webhook

**File: `supabase/functions/razorpay-webhook/index.ts`**

Add to `streamerSlugMap` (around line 21-25):

```typescript
const streamerSlugMap: Record<string, string> = {
  'looteriyagaming': 'looteriya_gaming',
  'chiagaming': 'chiaa_gaming',
  'ankit': 'ankit',
  'clumsygod': 'clumsy_god',  // NEW
};
```

Add table lookup in the donation search section (after looteriya_gaming check, around line 218):

```typescript
// Try clumsy_god
const clumsyGodResult = await supabase
  .from('clumsy_god_donations')
  .select('*')
  .eq('razorpay_order_id', razorpayOrderId)
  .maybeSingle();

if (clumsyGodResult.data) {
  donation = clumsyGodResult.data;
  streamerType = 'clumsygod';
  tableName = 'clumsy_god_donations';
}
```

### 2.3 Update TTS Generation

**File: `supabase/functions/generate-donation-tts/index.ts`**

Add to `donationTableMap` (around line 228-232):

```typescript
const donationTableMap: Record<string, string> = {
  ankit: "ankit_donations",
  chiaa_gaming: "chiaa_gaming_donations",
  looteriya_gaming: "looteriya_gaming_donations",
  clumsy_god: "clumsy_god_donations",  // NEW
};
```

### 2.4 Update Moderate Donation

**File: `supabase/functions/moderate-donation/index.ts`**

Add to streamer table mapping (similar pattern to other functions).

---

## Phase 3: Frontend Configuration

### 3.1 Update Streamer Config Registry

**File: `src/config/streamers.ts`**

Add new config entry:

```typescript
export const STREAMER_CONFIGS: Record<string, StreamerConfig> = {
  // ... existing configs ...
  clumsy_god: {
    slug: 'clumsy_god',
    name: 'Clumsy God',
    tableName: 'clumsy_god_donations',
    brandColor: '#10b981',
    pusherDashboardChannel: 'clumsy_god-dashboard',
    pusherGoalChannel: 'clumsy_god-goal',
    pusherAudioChannel: 'clumsy_god-audio',
    pusherAlertsChannel: 'clumsy_god-alerts',
    pusherSettingsChannel: 'clumsy_god-settings',
    razorpayOrderPrefix: 'cg2_rp_',
  },
};
```

### 3.2 Update Donation Page Config (Optional)

**File: `src/config/donationPageConfigs.ts`**

Add visual branding config:

```typescript
clumsy_god: {
  streamerSlug: 'clumsy_god',
  streamerName: 'Clumsy God',
  brandColor: '#10b981',
  logoSrc: '/assets/streamers/clumsy-god-logo.png',
  backgroundSrc: '/assets/streamers/clumsy-god-background.png',
  edgeFunctionName: 'create-razorpay-order-unified',
  themeDescription: 'Support Clumsy God with your donation',
},
```

---

## Phase 4: Frontend Pages

### 4.1 Create Donation Page

**File: `src/pages/ClumsyGod.tsx`**

Create based on `LooteriyaGaming.tsx` pattern (simplified version shown):

```typescript
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStreamerPricing } from "@/hooks/useStreamerPricing";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/constants/currencies";
// ... other imports

const ClumsyGod = () => {
  // State management (same pattern as LooteriyaGaming)
  const [formData, setFormData] = useState({ name: "", amount: "", message: "" });
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [donationType, setDonationType] = useState<"text" | "voice" | "hypersound" | "media">("text");
  // ... other state
  
  const { pricing } = useStreamerPricing('clumsy_god', selectedCurrency);
  const navigate = useNavigate();

  // Payment processing - calls unified function
  const processPayment = async () => {
    const { data, error } = await supabase.functions.invoke("create-razorpay-order-unified", {
      body: {
        streamer_slug: 'clumsy_god',  // KEY: identifies streamer
        name: formData.name,
        amount: parseFloat(formData.amount),
        message: donationType === "text" ? formData.message : null,
        // ... other fields
        currency: selectedCurrency,
      },
    });
    // ... Razorpay checkout handling
  };

  return (
    // UI with brand color #10b981
  );
};

export default ClumsyGod;
```

### 4.2 Create Dashboard Page

**File: `src/pages/dashboard/ClumsyGodDashboard.tsx`**

```typescript
import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.clumsy_god;

const ClumsyGodDashboard = () => {
  return (
    <StreamerDashboardWrapper
      streamerSlug={config.slug}
      streamerName={config.name}
      tableName={config.tableName}
      brandColor={config.brandColor}
    />
  );
};

export default ClumsyGodDashboard;
```

### 4.3 Create OBS Alert Pages

**File: `src/pages/obs-alerts/ClumsyGodObsAlerts.tsx`**

```typescript
import { ObsAlertsWrapper } from '@/components/obs/ObsAlertsWrapper';

const ClumsyGodObsAlerts = () => {
  return <ObsAlertsWrapper streamerSlug="clumsy_god" storagePrefix="clumsy_god" />;
};

export default ClumsyGodObsAlerts;
```

**File: `src/pages/obs-alerts/ClumsyGodGoalOverlay.tsx`**

```typescript
import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const ClumsyGodGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="clumsy_god" />
    </div>
  );
};

export default ClumsyGodGoalOverlay;
```

### 4.4 Create Media Source Audio Player

**File: `src/pages/audio-player/ClumsyGodMediaSourcePlayer.tsx`**

```typescript
import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Gamepad2 } from 'lucide-react';

const ClumsyGodMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="clumsy_god"
    streamerName="Clumsy God"
    tableName="clumsy_god_donations"
    browserSourcePath="/clumsy_god/audio-player"
    brandColor="#10b981"
    Icon={Gamepad2}
  />
);

export default ClumsyGodMediaSourcePlayer;
```

---

## Phase 5: Routing

### 5.1 Update App.tsx

**File: `src/App.tsx`**

Add imports:

```typescript
// Streamer donation pages
import ClumsyGod from "./pages/ClumsyGod";

// Dashboard pages
import ClumsyGodDashboard from "./pages/dashboard/ClumsyGodDashboard";

// OBS Alert pages
import ClumsyGodObsAlerts from "./pages/obs-alerts/ClumsyGodObsAlerts";
import ClumsyGodGoalOverlay from "./pages/obs-alerts/ClumsyGodGoalOverlay";

// Audio Player pages
import ClumsyGodMediaSourcePlayer from "./pages/audio-player/ClumsyGodMediaSourcePlayer";
```

Add routes:

```typescript
{/* Clumsy God Routes */}
<Route path="/clumsy_god" element={<ClumsyGod />} />
<Route path="/dashboard/clumsy_god" element={<ClumsyGodDashboard />} />
<Route path="/clumsy_god/obs-alerts" element={<ClumsyGodObsAlerts />} />
<Route path="/clumsy_god/goal-overlay" element={<ClumsyGodGoalOverlay />} />
<Route path="/clumsy_god/media-audio-player" element={<ClumsyGodMediaSourcePlayer />} />
```

### 5.2 Update Status Page

**File: `src/pages/Status.tsx`**

Add order prefix handling in `getCheckPaymentFunction` (around line 94-110):

```typescript
if (orderId.startsWith('cg2_rp_')) return 'check-payment-status-unified';
```

Add back link handling in `getBackLink` (around line 218-228):

```typescript
if (orderId.startsWith('cg2_rp_')) return "/clumsy_god";
```

---

## Phase 6: Assets (Optional)

Add streamer branding assets:
- `/public/assets/streamers/clumsy-god-logo.png`
- `/public/assets/streamers/clumsy-god-background.png` (or `.mp4` for video)

---

## Summary Checklist

| Step | File/Location | Action |
|------|---------------|--------|
| 1 | Database | Create `clumsy_god_donations` table with RLS |
| 2 | Database | Insert streamer record in `streamers` table |
| 3 | `create-razorpay-order-unified` | Add to `STREAMER_CONFIG` |
| 4 | `check-payment-status-unified` | Add to `STREAMER_CONFIG` |
| 5 | `razorpay-webhook` | Add to `streamerSlugMap` and table lookup |
| 6 | `generate-donation-tts` | Add to `donationTableMap` |
| 7 | `moderate-donation` | Add streamer table mapping |
| 8 | `src/config/streamers.ts` | Add `clumsy_god` config |
| 9 | `src/config/donationPageConfigs.ts` | Add visual config (optional) |
| 10 | `src/pages/ClumsyGod.tsx` | Create donation page |
| 11 | `src/pages/dashboard/ClumsyGodDashboard.tsx` | Create dashboard |
| 12 | `src/pages/obs-alerts/ClumsyGodObsAlerts.tsx` | Create OBS alerts |
| 13 | `src/pages/obs-alerts/ClumsyGodGoalOverlay.tsx` | Create goal overlay |
| 14 | `src/pages/audio-player/ClumsyGodMediaSourcePlayer.tsx` | Create audio player |
| 15 | `src/App.tsx` | Add all routes |
| 16 | `src/pages/Status.tsx` | Add order prefix handling |
| 17 | Assets | Add logo/background images |

---

## URLs After Implementation

| Purpose | URL |
|---------|-----|
| Donation Page | `/clumsy_god` |
| Dashboard | `/dashboard/clumsy_god` |
| OBS Alerts | `/clumsy_god/obs-alerts` |
| Goal Overlay | `/clumsy_god/goal-overlay` |
| Audio Player | `/clumsy_god/media-audio-player` |

---

## Important Notes

1. **Order Prefix**: Using `cg2_rp_` instead of `cg_rp_` to avoid conflict with Chiaa Gaming
2. **Unified Functions**: All payment processing uses unified edge functions - no streamer-specific functions needed
3. **Pusher Channels**: Follow `${slug}-channel` naming pattern exactly
4. **RLS Policies**: Same pattern as other streamers for security consistency
5. **No Old Code Changes**: All additions are additive - existing streamers remain untouched
