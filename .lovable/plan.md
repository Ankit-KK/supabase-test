

# Fix: Close Donation Table SQL Injection Vulnerability

## Problem
Someone inserted fake donations directly into `looteriya_gaming_donations` by exploiting an overly permissive RLS INSERT policy (`WITH CHECK (true)` for the `public` role). This lets anyone with the Supabase anon key insert rows with `payment_status: 'success'` -- completely bypassing Razorpay.

The two fake donations (`208b35a4...` and `396f9487...`) were never processed by Razorpay and have no matching orders in your Razorpay dashboard.

**Affected tables:**
- `looteriya_gaming_donations`
- `chiaa_gaming_donations`
- `clumsy_god_donations`
- `wolfy_donations`

**Not affected:** `ankit_donations` (already secured -- no public INSERT policy)

## Fix

### Step 1: Lock down INSERT policies
Replace the open `WITH CHECK (true)` INSERT policies with a restricted version that only allows inserts where `payment_status = 'pending'`. This way, even if someone inserts a row directly, it can never be pre-set to `'success'` -- only the edge functions (using service role) can update status to `'success'` after Razorpay confirms payment.

**SQL migration:**
```sql
-- Drop vulnerable INSERT policies
DROP POLICY "Anyone can create donations" ON looteriya_gaming_donations;
DROP POLICY "Anyone can create donations" ON chiaa_gaming_donations;
DROP POLICY "Anyone can create clumsy god donations" ON clumsy_god_donations;
DROP POLICY "Anyone can create wolfy donations" ON wolfy_donations;

-- Create restricted INSERT policies (only pending status allowed)
CREATE POLICY "Public can create pending donations"
  ON looteriya_gaming_donations FOR INSERT
  WITH CHECK (payment_status = 'pending' AND moderation_status = 'pending' AND mod_notified = false);

CREATE POLICY "Public can create pending donations"
  ON chiaa_gaming_donations FOR INSERT
  WITH CHECK (payment_status = 'pending' AND moderation_status = 'pending' AND mod_notified = false);

CREATE POLICY "Public can create pending donations"
  ON clumsy_god_donations FOR INSERT
  WITH CHECK (payment_status = 'pending' AND moderation_status = 'pending' AND mod_notified = false);

CREATE POLICY "Public can create pending donations"
  ON wolfy_donations FOR INSERT
  WITH CHECK (payment_status = 'pending' AND moderation_status = 'pending' AND mod_notified = false);
```

### Step 2: Delete the fake donations
```sql
DELETE FROM looteriya_gaming_donations
WHERE id IN (
  '208b35a4-097a-4737-98c1-fcf94802eb9b',
  '396f9487-e6bf-4da1-9d98-7c639df9ad36'
);
```

### Step 3: Verify no code changes needed
The edge functions (`create-razorpay-order-unified`, `check-payment-status-unified`, `razorpay-webhook`) all use the **service role key**, which bypasses RLS entirely. So this policy change has zero impact on legitimate payment flow.

## What this prevents
- Direct database inserts with fake `payment_status: 'success'`
- Pre-setting `mod_notified: true` to skip Telegram notifications
- Pre-setting `moderation_status` to bypass moderation

## What stays the same
- All edge functions continue working (they use service role)
- Legitimate donation flow is unchanged
- No frontend code changes needed
- No other streamers affected

