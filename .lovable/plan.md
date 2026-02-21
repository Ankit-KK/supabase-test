

# Security Hardening Plan

## Overview
The scan found 5 critical and 8 warning-level issues. Most donation tables are already well-protected against unauthorized inserts. The main risks are around a Security Definer view, verifying service_role policy scoping, and enabling additional protections.

## Priority 1: Fix Security Definer View (CRITICAL)

**Problem:** One or more database views use SECURITY DEFINER, which bypasses RLS and runs with elevated privileges. This could allow unauthorized data access through the view.

**Fix:** Run a migration to identify and recreate the affected view(s) with `security_invoker = on`. Based on the project's memory, all views should already use this -- need to find the one that doesn't.

**Migration SQL:**
```text
-- Identify the offending view(s) and recreate with security_invoker = on
-- Example pattern:
ALTER VIEW <view_name> SET (security_invoker = on);
```

## Priority 2: Verify Service Role Policy Scoping (CRITICAL)

**Problem:** Multiple donation tables have "Service role can manage all donations" policies with `USING (true)` and `WITH CHECK (true)`. If these are NOT scoped to `TO service_role`, they would allow ANY role (including anon) to INSERT, UPDATE, and DELETE donation records.

**Fix:** Run a query to check if these policies are scoped correctly, then recreate any that aren't:

**Tables to verify:**
- ankit_donations
- chiaa_gaming_donations
- looteriya_gaming_donations
- wolfy_donations
- brigzard_donations
- mr_champion_donations
- w_era_donations
- dorp_plays_donations
- zishu_donations
- streamers_moderators
- telegram_callback_mapping

**Migration pattern for each affected table:**
```text
DROP POLICY IF EXISTS "Service role can manage all donations" ON <table>;
CREATE POLICY "Service role can manage all donations"
  ON <table> FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## Priority 3: Enable Leaked Password Protection (WARNING)

**Problem:** Supabase Auth's leaked password protection is disabled.

**Fix:** This is a setting change in the Supabase dashboard, not a code change.
Go to: Authentication > Settings > Enable "Leaked Password Protection"

## Priority 4: Move Extensions from Public Schema (WARNING)

**Problem:** Database extensions (likely `uuid-ossp` and `pgcrypto`) are installed in the `public` schema, which exposes them to all users.

**Fix:** Migration to move extensions to the `extensions` schema:
```text
ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
ALTER EXTENSION "pgcrypto" SET SCHEMA extensions;
```

## Priority 5: Add CSRF Server-Side Validation (WARNING)

**Problem:** CSRF tokens are generated client-side but never validated server-side in edge functions. Authenticated dashboard operations (settings updates, moderator management) could be triggered by cross-site requests.

**Fix:** Add origin validation to authenticated edge functions. For functions that require `x-auth-token`, add a check:
```text
-- In each authenticated edge function:
const origin = req.headers.get('origin');
const allowedOrigins = ['https://hyper-chat.lovable.app', 'https://id-preview--854a7833-ea4b-49d4-a1e0-c38c31892630.lovable.app'];
if (origin && !allowedOrigins.includes(origin)) {
  return 403 Forbidden
}
```

**Affected edge functions:**
- update-streamer-settings
- manage-moderators
- broadcast-settings-update
- moderate-donation
- generate-obs-token
- transcribe-voice-sarvam

Note: Public-facing functions (create-razorpay-order, donation pages, OBS alerts) must keep CORS '*' as they're used from external sources.

## What Does NOT Need Fixing

These are already secure:
- Donation tables block public INSERT (anon cannot create fake donations)
- Payment webhooks verify HMAC-SHA256 signatures
- Auth tables (auth_users, auth_sessions, password_reset_tokens) deny all non-service-role access
- Edge functions validate session tokens via x-auth-token
- Public donation views filter to approved + paid only
- Input validation on signup and review forms
- Rate limiting on all state-changing endpoints

## Implementation Order

1. Run diagnostic query to identify the Security Definer view and verify service_role policy scoping
2. Fix any misconfigured policies via migration
3. Add origin validation to authenticated edge functions
4. Enable leaked password protection in Supabase dashboard
5. Move extensions to proper schema

## Files to Create/Modify

- 1 database migration (fix view + verify/fix policies)
- 6 edge functions (add origin validation to authenticated functions)
- No frontend changes needed
- No donation page changes

