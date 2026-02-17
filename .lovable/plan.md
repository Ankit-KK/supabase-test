

# Add New Streamer: "Zishu" -- Complete Integration Plan

This plan covers every layer needed to add Zishu as a new streamer, following the exact same patterns used by DorpPlays, Wolfy, and other existing streamers.

---

## 1. Database

### 1a. Create `zishu_donations` table
Clone the exact schema from `dorp_plays_donations` (same columns, types, defaults):
- `id`, `streamer_id`, `name`, `amount`, `currency`, `message`, `voice_message_url`, `hypersound_url`, `media_url`, `media_type`, `is_hyperemote`, `order_id`, `razorpay_order_id`, `payment_status`, `moderation_status`, `tts_audio_url`, `message_visible`, `created_at`

### 1b. RLS policies on `zishu_donations`
- Enable RLS
- **No public INSERT policy** (only edge functions with `service_role` can insert -- matches the full lockdown pattern)
- SELECT policy for `authenticated` role (dashboard reads)
- GRANT SELECT on the table to `anon` and `authenticated` roles

### 1c. Insert Zishu into `streamers` table
Insert a row with:
- `streamer_slug`: `zishu`
- `streamer_name`: `Zishu`
- `moderation_mode`: `none` (can be changed later from dashboard)
- `tts_enabled`: `true`
- `pusher_group`: assign to appropriate group

---

## 2. Configuration Files (Frontend)

### 2a. `src/config/streamers.ts`
Add `zishu` entry to `STREAMER_CONFIGS`:
```
zishu: {
  slug: 'zishu', name: 'Zishu', tableName: 'zishu_donations', brandColor: '#e11d48',
  pusherDashboardChannel: 'zishu-dashboard', pusherGoalChannel: 'zishu-goal',
  pusherAudioChannel: 'zishu-audio', pusherAlertsChannel: 'zishu-alerts',
  pusherSettingsChannel: 'zishu-settings', razorpayOrderPrefix: 'zs_rp_',
}
```

### 2b. `src/config/donationPageConfigs.ts`
Add `zishu` entry to `DONATION_PAGE_CONFIGS`:
```
zishu: {
  streamerSlug: 'zishu', streamerName: 'Zishu', brandColor: '#e11d48',
  logoSrc: '/assets/streamers/zishu-logo.png',
  backgroundSrc: '/assets/streamers/zishu-background.png',
  edgeFunctionName: 'create-razorpay-order-unified',
  themeDescription: 'Support Zishu with your donation',
}
```

---

## 3. Frontend Pages (6 new files)

All follow existing patterns exactly -- minimal wrapper components.

### 3a. Donation page: `src/pages/Zishu.tsx`
Clone DorpPlays.tsx pattern, replace all references:
- `streamer_slug: "zishu"`
- Brand color: `#e11d48`
- Streamer name: "Zishu"

### 3b. Dashboard: `src/pages/dashboard/ZishuDashboard.tsx`
```tsx
import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";
const config = STREAMER_CONFIGS.zishu;
const ZishuDashboard = () => (
  <StreamerDashboardWrapper streamerSlug={config.slug} streamerName={config.name}
    tableName={config.tableName} brandColor={config.brandColor} />
);
export default ZishuDashboard;
```

### 3c. OBS Alerts: `src/pages/obs-alerts/ZishuObsAlerts.tsx`
```tsx
import { ObsAlertsWrapper } from '@/components/obs/ObsAlertsWrapper';
const ZishuObsAlerts = () => <ObsAlertsWrapper streamerSlug="zishu" storagePrefix="zishu" />;
export default ZishuObsAlerts;
```

### 3d. Goal Overlay: `src/pages/obs-alerts/ZishuGoalOverlay.tsx`
```tsx
import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';
const ZishuGoalOverlay = () => (
  <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
    <GoalOverlayWrapper streamerSlug="zishu" />
  </div>
);
export default ZishuGoalOverlay;
```

### 3e. Media Source Player: `src/pages/audio-player/ZishuMediaSourcePlayer.tsx`
```tsx
import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
const ZishuMediaSourcePlayer = () => (
  <MediaSourcePlayer streamerSlug="zishu" streamerName="Zishu"
    tableName="zishu_donations" browserSourcePath="/zishu/media-audio-player"
    brandColor="#e11d48" />
);
export default ZishuMediaSourcePlayer;
```

---

## 4. Routing (`src/App.tsx`)

Add these routes:
- `/zishu` -- Donation page
- `/dashboard/zishu` -- Dashboard
- `/zishu/obs-alerts` -- OBS alerts
- `/zishu/goal-overlay` -- Goal overlay
- `/zishu/media-audio-player` -- Media source player

---

## 5. Status Page (`src/pages/Status.tsx`)

Two additions:
1. **`getCheckPaymentFunction`**: Add `if (orderId.startsWith('zs_rp_')) return 'check-payment-status-unified';`
2. **`getBackLink`**: Add `if (orderId.startsWith('zs_rp_')) return "/zishu";`

---

## 6. Edge Function Updates (maps only -- no new functions)

Zishu uses the **unified** edge functions. Only mapping entries need to be added:

### 6a. `create-razorpay-order-unified/index.ts`
Add to `STREAMER_CONFIG`:
```
'zishu': { table: 'zishu_donations', prefix: 'zs_rp_' },
```

### 6b. `check-payment-status-unified/index.ts`
Add to `STREAMER_CONFIG`:
```
'zishu': { table: 'zishu_donations', prefix: 'zs_rp_' },
```

### 6c. `razorpay-webhook/index.ts`
1. Add to `streamerSlugMap`: `'zishu': 'zishu'`
2. Add a new `else` block in the donation lookup chain to try `zishu_donations`

### 6d. `generate-donation-tts/index.ts`
Add to `donationTableMap`: `zishu: "zishu_donations"`

### 6e. `get-current-audio/index.ts`
Add to both maps:
- `STREAMER_TABLE_MAP`: `'zishu': 'zishu_donations'`
- `STREAMER_CHANNEL_MAP`: `'zishu': 'zishu-alerts'`

### 6f. `notify-new-donations/index.ts`
No changes needed -- it receives table_name and streamer_id dynamically from the webhook.

---

## 7. Security Checklist

| Area | Status |
|------|--------|
| RLS enabled on `zishu_donations` | Yes |
| No public INSERT policy (service_role only) | Yes |
| XSS sanitization (unified function handles it) | Already in place |
| Input validation (name, amount, message length) | Already in place |
| Razorpay signature verification (webhook) | Already in place |
| OBS token authentication | Already in place |
| Dashboard access control via `get_user_streamers` RPC | Already in place |

---

## 8. Post-Implementation Steps

1. **Add Zishu's logo** to `public/assets/streamers/zishu-logo.png`
2. **Add streamer access** in the `streamers` and `streamer_users` tables for the Zishu account owner
3. **Assign Pusher group** -- set the correct `pusher_group` value in the `streamers` table
4. **Deploy edge functions** -- all 5 modified functions will auto-deploy
5. **Test end-to-end** -- donation flow, payment verification, dashboard, OBS alerts, TTS

---

## Summary of Changes

| Type | Files | Count |
|------|-------|-------|
| New frontend pages | Zishu.tsx, ZishuDashboard, ZishuObsAlerts, ZishuGoalOverlay, ZishuMediaSourcePlayer | 5 |
| Modified frontend | App.tsx, Status.tsx, streamers.ts, donationPageConfigs.ts | 4 |
| Modified edge functions | create-razorpay-order-unified, check-payment-status-unified, razorpay-webhook, generate-donation-tts, get-current-audio | 5 |
| Database migration | Create table + RLS + insert streamer row | 1 |

