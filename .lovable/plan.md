

# Remove Public INSERT Policies from All Donation Tables

## What This Fixes

Currently, 4 donation tables allow anyone to insert "pending" donation records directly into the database without going through the Edge Functions. While these records can only be "pending" status, an attacker could still spam thousands of fake pending records, cluttering the moderation queue and wasting storage.

## Tables to Update

The following tables have a "Public can create pending donations" INSERT policy that needs to be dropped:

1. `chiaa_gaming_donations`
2. `clumsy_god_donations`
3. `looteriya_gaming_donations`
4. `wolfy_donations`

`ankit_donations` is already locked down (only service_role has access).

## Why This Is Safe

All legitimate donation inserts go through Edge Functions like `create-razorpay-order-chiagaming`, `create-razorpay-order-looteriya-gaming`, `create-razorpay-order-unified`, etc. These functions use the `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS entirely. Removing the public INSERT policy will have zero impact on the donation flow.

## Technical Details

A single database migration will run the following SQL:

```sql
DROP POLICY "Public can create pending donations" ON chiaa_gaming_donations;
DROP POLICY "Public can create pending donations" ON clumsy_god_donations;
DROP POLICY "Public can create pending donations" ON looteriya_gaming_donations;
DROP POLICY "Public can create pending donations" ON wolfy_donations;
```

After this, the only way to insert into these tables is via `service_role` -- which is exactly how the Edge Functions operate.

No code changes are needed. No Edge Functions are affected.

