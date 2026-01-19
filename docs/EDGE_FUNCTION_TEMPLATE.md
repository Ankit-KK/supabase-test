# Edge Function Standards and Templates

This document outlines the standard patterns all edge functions must follow for consistency across streamers.

## Environment Variables

### Razorpay Credentials
Always use these standardized names:
```typescript
const razorpayKeyId = Deno.env.get('razorpay-keyid');
const razorpayKeySecret = Deno.env.get('razorpay-keysecret');
```

**DO NOT USE:**
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_KEY_ID_<STREAMER>`
- Any other variation

### Supabase Credentials
```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
```

---

## Currency Conversion

Always convert foreign currencies to INR for goal calculations and revenue stats:

```typescript
const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  'INR': 1,
  'USD': 89,
  'EUR': 94,
  'GBP': 113,
  'AED': 24,
  'AUD': 57,
};

const convertToINR = (amount: number, currency: string = 'INR'): number => {
  const rate = EXCHANGE_RATES_TO_INR[currency] || 1;
  return amount * rate;
};
```

**Important:** Always include `currency` field when querying donations for goal progress.

---

## Pusher Event Names

Use these exact event names:

| Purpose | Event Name |
|---------|------------|
| New donation notification | `new-donation` |
| Donation approved | `donation-approved` |
| Donation updated (rejected, etc.) | `donation-updated` |
| Audio queue | `new-audio-message` |
| Goal progress update | `goal-progress` |
| Dashboard stats update | `stats-updated` |

---

## Moderation Status Values

| Status | Value | Description |
|--------|-------|-------------|
| Pending | `pending` | Awaiting moderation |
| Auto-approved | `auto_approved` | Automatically approved (hyperemotes, etc.) |
| Approved | `approved` | Manually approved by moderator |
| Rejected | `rejected` | Rejected by moderator |

**Important:** When querying for "approved" donations (e.g., leaderboard), include BOTH:
```typescript
.in("moderation_status", ["auto_approved", "approved"])
```

---

## Goal Progress Updates

Standard format for goal progress Pusher events:

```typescript
// Query donations with currency
const { data: donations } = await supabaseClient
  .from(`${streamer}_donations`)
  .select('amount, currency')
  .eq('payment_status', 'success')
  .in('moderation_status', ['auto_approved', 'approved'])
  .gte('created_at', goalActivatedAt);

// Calculate total with currency conversion
const currentAmount = donations?.reduce((sum, d) => {
  return sum + convertToINR(d.amount, d.currency || 'INR');
}, 0) || 0;

// Send Pusher event
await pusher.trigger(`${streamer}-goal`, 'goal-progress', {
  currentAmount,
  targetAmount: goalTargetAmount,
});
```

---

## Order ID Prefixes

Each streamer has a unique prefix for Razorpay order IDs:

| Streamer | Prefix |
|----------|--------|
| ABdevil | `ab_rp_` |
| Ankit | `ank_rp_` |
| BongFlick | `bf_rp_` |
| Chiaa Gaming | `cg_rp_` |
| ClumsyGod | `cg_rp_` |
| Damask Plays | `dp_rp_` |
| Jhanvoo | `jh_rp_` |
| Jimmy Gaming | `jg_rp_` |
| Looteriya Gaming | `lg_rp_` |
| Mr Iqmaster | `mi_rp_` |
| Neko Xenpai | `nx_rp_` |
| Not Your Kween | `nyk_rp_` |
| Sagar Ujjwal Gaming | `sug_rp_` |
| Sizzors | `sz_rp_` |
| ThunderX | `tx_rp_` |
| VIP BHAI | `vb_rp_` |

---

## CORS Headers

Always include these headers for web-accessible functions:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

---

## Response Format

### create-razorpay-order Response
```typescript
return new Response(JSON.stringify({
  orderId: internalOrderId,        // e.g., "lg_rp_1234567890_abc123"
  razorpay_order_id: rpOrderId,    // Razorpay's order ID
  razorpay_key_id: razorpayKeyId,  // For checkout initialization
  amount: amount,
  currency: currency,
  internalOrderId: internalOrderId, // Duplicate for compatibility
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

### check-payment-status Response
```typescript
return new Response(JSON.stringify({
  success: true,
  status: donation.payment_status,
  donation: donation,
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

---

## Webhook Processing Order

For Razorpay webhooks, operations MUST execute in this order:

1. Update donation status in database
2. Generate TTS audio (wait for completion)
3. Send Pusher events (dashboard, audio, alerts, goal)
4. Send Telegram notification (if enabled)

**Critical:** TTS must complete BEFORE sending audio player events, otherwise the player receives data without `tts_audio_url`.

---

## Logging

Always include descriptive logs:

```typescript
console.log(`[${streamer}] Creating order for ${amount} ${currency}`);
console.log(`[${streamer}] Payment verified for order ${orderId}`);
console.error(`[${streamer}] Error:`, error.message);
```

---

## Adding a New Streamer

1. Add config to `src/config/streamers.ts`
2. Create dashboard page using `StreamerDashboardWrapper`
3. Create edge functions following these templates:
   - `create-razorpay-order-{streamer}`
   - `check-payment-status-{streamer}`
4. Add routes to `App.tsx`
5. Update Razorpay webhook to handle new streamer's donations table
