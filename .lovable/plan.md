

## Change Password Reset Email Sender Domain

### Problem
The `request-password-reset` edge function sends emails from `noreply@hyperchat.site`, but the verified Resend domain is `hyperchat.space`. This causes a "domain not verified" error.

### Change
**File:** `supabase/functions/request-password-reset/index.ts`

Update the `from` field in the `resend.emails.send()` call:

- **Before:** `'HyperChat <noreply@hyperchat.site>'`
- **After:** `'HyperChat <noreply@hyperchat.space>'`

This is a single-line change (line ~138). No other files or edge functions are affected.

