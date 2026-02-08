

# Fix Critical Security Vulnerabilities - Step 1: Password Reset Tokens RLS

We will tackle the 5 critical vulnerabilities **one at a time**. Starting with the most dangerous one first.

---

## Priority Order

1. **Password Reset Tokens RLS** (this plan) -- attackers could read/modify reset tokens to hijack any account
2. Security Definer Views -- views bypass RLS entirely
3. OBS Token Exposure -- missing deny policies allow token theft
4. Exposed PII in user_signups -- unencrypted personal data
5. Auth Users Credential Hardening -- password hash protection

---

## Step 1: Add RLS Policies to `password_reset_tokens`

### The Problem

The `password_reset_tokens` table has **RLS enabled but zero policies defined**. This means by default no one can access it via the client SDK -- but there are no explicit deny rules for anon/authenticated roles, and no explicit service_role grant. This should be locked down properly.

### Database Migration

Add three RLS policies:

```sql
-- 1. Deny all anonymous access
CREATE POLICY "Deny anonymous access to password_reset_tokens"
  ON public.password_reset_tokens
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- 2. Deny all authenticated user access
CREATE POLICY "Deny authenticated access to password_reset_tokens"
  ON public.password_reset_tokens
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- 3. Allow service role full access (used by edge functions)
CREATE POLICY "Service role can manage password_reset_tokens"
  ON public.password_reset_tokens
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Why This Matters

Without explicit deny policies, if Supabase defaults ever change or a misconfiguration occurs, attackers could:
- Read token hashes and brute-force them
- Mark tokens as unused to reuse expired links
- Delete tokens to prevent legitimate password resets

### No Code Changes Required

The edge functions (`request-password-reset`, `validate-reset-token`, `reset-password`) already use the service role key, so they will continue to work as before.

---

After this is approved and applied, we will move to **Step 2: Security Definer Views**.

