

# Egress Reduction v4: Final Implementation Plan

Incorporating all 10 remaining corrections into the approved v3 architecture.

---

## Phase 1: Database Migration

Single migration containing all schema changes.

### 1A. `streamer_donator_totals` table

```sql
CREATE TABLE streamer_donator_totals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_slug text NOT NULL,
  donator_name text NOT NULL,
  donator_name_lower text NOT NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  donation_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (streamer_slug, donator_name_lower)
);
```

Index for index-only scan on leaderboard:

```sql
CREATE INDEX idx_streamer_top_donator
  ON streamer_donator_totals (streamer_slug, total_amount DESC)
  INCLUDE (donator_name);
```

RLS: public SELECT, service_role ALL.

### 1B. `order_lookup` table

```sql
CREATE TABLE order_lookup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id text NOT NULL UNIQUE,
  order_id text NOT NULL,
  streamer_slug text NOT NULL,
  donation_table_id smallint NOT NULL,
  donation_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

Using `smallint` for `donation_table_id` instead of text. Mapping defined in code:

```text
0 = ankit_donations
1 = chiaa_gaming_donations
2 = looteriya_gaming_donations
3 = clumsy_god_donations
4 = wolfy_donations
5 = dorp_plays_donations
6 = zishu_donations
7 = brigzard_donations
8 = w_era_donations
9 = mr_champion_donations
```

Covering index for index-only scan:

```sql
CREATE INDEX idx_order_lookup_fast
  ON order_lookup (razorpay_order_id)
  INCLUDE (streamer_slug, donation_table_id, donation_id);
```

RLS: service_role ALL only.

### 1C. Atomic increment RPC

```sql
CREATE OR REPLACE FUNCTION increment_donator_total(
  p_streamer_slug text,
  p_donator_name text,
  p_amount numeric
)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO streamer_donator_totals
    (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
  VALUES (p_streamer_slug, p_donator_name, lower(p_donator_name), p_amount, 1)
  ON CONFLICT (streamer_slug, donator_name_lower)
  DO UPDATE SET
    total_amount = streamer_donator_totals.total_amount + EXCLUDED.total_amount,
    donation_count = streamer_donator_totals.donation_count + 1,
    donator_name = EXCLUDED.donator_name,
    updated_at = now();
$$;
```

Decrement RPC for reject of previously approved:

```sql
CREATE OR REPLACE FUNCTION decrement_donator_total(
  p_streamer_slug text,
  p_donator_name text,
  p_amount numeric
)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE streamer_donator_totals
  SET total_amount = GREATEST(0, total_amount - p_amount),
      donation_count = GREATEST(0, donation_count - 1),
      updated_at = now()
  WHERE streamer_slug = p_streamer_slug
    AND donator_name_lower = lower(p_donator_name);
$$;
```

### 1D. `amount_inr` column on all donation tables

```sql
ALTER TABLE ankit_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
ALTER TABLE chiaa_gaming_donations ADD COLUMN IF NOT EXISTS amount_inr numeric(12,2);
-- ... repeat for all 10 tables
```

### 1E. Moderation queue indexes (per table, with streamer_id)

```sql
CREATE INDEX IF NOT EXISTS idx_ankit_donations_mod_queue
  ON ankit_donations (streamer_id, moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';
-- ... repeat for all 10 tables
```

### 1F. Backfill `streamer_donator_totals`

One aggregated INSERT per table (not row-by-row):

```sql
INSERT INTO streamer_donator_totals (streamer_slug, donator_name, donator_name_lower, total_amount, donation_count)
SELECT 'ankit', name, lower(name), SUM(amount * CASE currency WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END), COUNT(*)
FROM ankit_donations
WHERE payment_status = 'success' AND moderation_status IN ('auto_approved', 'approved')
GROUP BY name, lower(name)
ON CONFLICT (streamer_slug, donator_name_lower)
DO UPDATE SET total_amount = EXCLUDED.total_amount, donation_count = EXCLUDED.donation_count, updated_at = now();
-- ... repeat for all 10 tables
```

### 1G. Backfill `amount_inr`

```sql
UPDATE ankit_donations SET amount_inr = amount * CASE currency WHEN 'USD' THEN 89 WHEN 'EUR' THEN 94 WHEN 'GBP' THEN 113 WHEN 'AED' THEN 24 WHEN 'AUD' THEN 57 ELSE 1 END WHERE amount_inr IS NULL;
-- ... repeat for all 10 tables
```

---

## Phase 2: `create-razorpay-order-unified`

Two changes:

1. **Insert into `order_lookup`** after creating the donation row (after line 254):
   - Map table name to `donation_table_id` using the code-level mapping
   - Insert `{ razorpay_order_id, order_id, streamer_slug, donation_table_id, donation_id }`

2. **Store `amount_inr`** in the donation insert payload (line 238):
   - Compute `amount_inr = amount * (EXCHANGE_RATES_TO_INR[currency] || 1)`
   - Add to the insert object

---

## Phase 3: `razorpay-webhook` rewrite

Replace the 10-table sequential scan (lines 202-332) with:

1. **Lookup from `order_lookup`** -- single indexed query returning `streamer_slug`, `donation_table_id`, `donation_id`
2. **Map `donation_table_id` back to table name** using code constant
3. **Fetch donation with scoped fields**: `select('id, payment_status, amount, amount_inr, currency, name, message, streamer_id, voice_message_url, tts_audio_url, hypersound_url, is_hyperemote, media_url, media_type, order_id, razorpay_order_id, mod_notified')`

**Idempotency guard** (correction #5): The existing check on line 342 (`donation.payment_status === 'success'`) already handles this. Additionally, make the DB update conditional:

```typescript
const { data: updated, error: updateError } = await supabase
  .from(tableName)
  .update(updateData)
  .eq('id', donation.id)
  .neq('payment_status', 'success')  // Only update if not already processed
  .select('id')
  .maybeSingle();

if (!updated) {
  console.log('Already processed (race condition), skipping');
  return new Response('Already processed', { status: 200, headers: corsHeaders });
}
```

This prevents double leaderboard increments from duplicate webhooks.

**Replace leaderboard full-table scan** (lines 532-570): Replace with RPC call:

```typescript
await supabase.rpc('increment_donator_total', {
  p_streamer_slug: streamerSlug,
  p_donator_name: donation.name,
  p_amount: donation.amount_inr || convertToINR(donation.amount, paymentCurrency)
});

const { data: topDonator } = await supabase
  .from('streamer_donator_totals')
  .select('donator_name, total_amount')
  .eq('streamer_slug', streamerSlug)
  .order('total_amount', { ascending: false })
  .limit(1)
  .maybeSingle();
```

**Eliminate post-TTS refetch** (lines 631-636): Use TTS response `audioUrl` directly instead of re-querying:

```typescript
const ttsAudioUrl = ttsResponse?.data?.audioUrl || donation.tts_audio_url;
// Use ttsAudioUrl in the Pusher payload directly
```

---

## Phase 4: `check-payment-status-unified`

Same changes as webhook:
- **Line 130**: Replace `select('*')` with scoped fields
- **Lines 339-373**: Replace leaderboard full-table scan with `increment_donator_total` RPC + single-row read
- **Lines 418-423**: Eliminate post-TTS refetch, use `ttsResponse?.data?.audioUrl` directly
- Add idempotency guard on the update (`.neq('payment_status', 'success')`)
- Store `amount_inr` when updating currency on line 236

---

## Phase 5: `moderate-donation`

- **Line 278**: Replace `select('*')` with scoped fields: `select('id, name, amount, amount_inr, currency, message, voice_message_url, tts_audio_url, hypersound_url, is_hyperemote, media_url, media_type, moderation_status, payment_status, message_visible, streamer_id, selected_gif_id, created_at')`
- **Lines 562-601** (approve leaderboard): Replace full-table scan with `increment_donator_total` RPC + single-row read
- **Reject handling**: If rejecting a previously approved donation, call `decrement_donator_total` RPC

---

## Phase 6: `useLeaderboard.ts`

Replace the unbounded initial fetch (lines 46-51) with aggregation table read:

```typescript
const { data: topData } = await supabase
  .from('streamer_donator_totals')
  .select('donator_name, total_amount')
  .eq('streamer_slug', streamerSlug)
  .order('total_amount', { ascending: false })
  .limit(1)
  .maybeSingle();

if (topData) {
  setTopDonator({ name: topData.donator_name, totalAmount: topData.total_amount });
}
```

Keep the latest-5-donations query unchanged (already limited).

---

## Phase 7: Dashboard query scoping

**`StreamerDashboard.tsx` line 222**: Replace `select('*')` on streamers with:
```
select('id, streamer_slug, streamer_name, user_id, brand_color, moderation_mode, tts_enabled, media_upload_enabled, media_moderation_enabled, hyperemotes_enabled, leaderboard_widget_enabled, pusher_group')
```

**Line 315**: Replace `select('*')` on donations with list-only fields:
```
select('id, name, amount, currency, created_at, media_type, payment_status, moderation_status, message_visible, is_hyperemote')
```

Full detail (message, URLs) fetched on-demand when user clicks a donation card via a new `DonationDetailModal` component.

**`get-moderation-queue`**: Scope select and use `count: 'planned'` instead of `count: 'exact'`.

---

## Phase 8: `order_lookup` auto-expiry

Add a pg_cron job (or Supabase scheduled function) to clean up old entries:

```sql
SELECT cron.schedule('cleanup-order-lookup', '0 3 * * *',
  $$DELETE FROM order_lookup WHERE created_at < now() - interval '30 days'$$
);
```

---

## Phase 9: New `DonationDetailModal` component

Simple modal that fetches full donation row on-demand when a card is clicked:

```typescript
const { data } = await supabase
  .from(tableName)
  .select('message, voice_message_url, tts_audio_url, hypersound_url, media_url, media_type')
  .eq('id', donationId)
  .single();
```

Reduces dashboard list payload by ~60%.

---

## Files Modified

| File | Change |
|---|---|
| Migration SQL | Tables, RPC, indexes, backfill |
| `create-razorpay-order-unified` | Insert `order_lookup`, store `amount_inr` |
| `razorpay-webhook` | Replace 10-table scan with `order_lookup`, RPC leaderboard, idempotent update, remove refetch |
| `check-payment-status-unified` | Same optimizations as webhook |
| `moderate-donation` | Scope select, RPC leaderboard on approve/reject |
| `useLeaderboard.ts` | Read from `streamer_donator_totals` |
| `StreamerDashboard.tsx` | Scope selects, split list/detail |
| `src/config/streamers.ts` | Add `DONATION_TABLE_ID_MAP` constant |
| New: `DonationDetailModal.tsx` | On-demand detail fetch |
| `supabase/config.toml` | No changes needed |

## Execution Order

1. Database migration (all schema + backfill)
2. `create-razorpay-order-unified` (order_lookup + amount_inr)
3. `razorpay-webhook` (order_lookup, RPC, idempotency, remove refetch)
4. `check-payment-status-unified` (same)
5. `moderate-donation` (RPC, scoped select)
6. `useLeaderboard.ts` (aggregation table)
7. `StreamerDashboard.tsx` (scoped selects)
8. `DonationDetailModal` (new component)
9. `order_lookup` cleanup cron

## Expected Metrics

| Metric | Before | After |
|---|---|---|
| Webhook DB queries | 10 sequential `select('*')` | 2 indexed (order_lookup + donation) |
| Leaderboard fetch | Thousands of rows | 1 row (index-only scan) |
| Dashboard list payload | ~1.5KB/row x 50 | ~400B/row x 50 |
| Post-TTS refetch | 1 full row/donation | 0 |
| Monthly egress (50-100 streamers) | 10-40 GB | ~1-1.5 GB |

