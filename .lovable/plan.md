

# Fix Critical Security Vulnerabilities - Step 2: Security Definer Views

## Completed

- ✅ **Step 1: Password Reset Tokens RLS** — deny policies added for anon/authenticated, service_role granted access.

---

## Priority Order

1. ~~Password Reset Tokens RLS~~ ✅
2. **Security Definer Views** (this plan)
3. OBS Token Exposure
4. Exposed PII in user_signups
5. Auth Users Credential Hardening

---

## Step 2: Fix Security Definer Views

### The Problem

Views with `SECURITY DEFINER` run queries using the **view creator's permissions** (typically a superuser), completely bypassing RLS on the underlying tables. This means any user who can query these views gets unrestricted access to the data, regardless of RLS policies.

### Affected Views

All `_public` donation views and the `auth_sessions_safe` / `user_signups_*` views are likely defined with `SECURITY DEFINER`.

### Solution

Recreate each view **without** `SECURITY DEFINER` (or explicitly with `SECURITY INVOKER`), so queries respect the calling user's RLS policies.

### Next Steps

1. Identify all security definer views
2. Recreate them with `SECURITY INVOKER = true`
3. Verify edge functions still work correctly

---

After this is approved and applied, we will move to **Step 3: OBS Token Exposure**.

