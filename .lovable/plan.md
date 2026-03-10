

# Fix Open Redirect Vulnerability + Security Hardening

## 1. Critical Fix: Open Redirect in Auth.tsx
The `redirect` query parameter is used directly without validation. An attacker can craft `/auth?redirect=https://evil-site.com` to phish users.

**Fix:** Validate that the redirect path starts with `/` and contains no `://` or `//`.

**File:** `src/pages/Auth.tsx`
- Replace the raw `searchParams.get('redirect')` with a safe validation check
- Fallback to `/dashboard` if validation fails

## 2. Harden CSP Headers
**File:** `vercel.json`
- Add `Content-Security-Policy` header with `object-src 'none'`, `frame-ancestors 'none'`, and scoped `script-src` / `connect-src`
- Remove `unsafe-eval` for production (keep `unsafe-inline` for styles as required by Razorpay)

## 3. Tighten CORS on Admin Edge Functions
No client-side changes needed — this is a note that the authenticated edge functions already have origin validation per the memory context. No action required here.

## Summary
Two file edits: `Auth.tsx` (redirect validation) and `vercel.json` (CSP hardening). Addresses the 1 FAIL and 1 WARN item.

