

# Plan: Validate Reset Token on Page Load

## Problem

Currently, when a user clicks an expired or already-used password reset link:
1. They see the password reset form
2. They fill in their new password
3. They click "Reset Password"
4. Only THEN do they see "This reset link has expired"

This is frustrating because they wasted time filling out the form.

## Solution

Add upfront token validation when the page loads, so users immediately know if their link is valid before showing the form.

---

## Implementation

### 1. Create a Token Validation Edge Function

**New file: `supabase/functions/validate-reset-token/index.ts`**

A lightweight function that checks if a token is valid without using it:
- Hash the token and look it up in `password_reset_tokens`
- Check if it's expired or already used
- Return status: `valid`, `expired`, `used`, or `invalid`

```text
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│  User clicks    │ ──────► │  validate-reset-     │ ──────► │  Check token    │
│  reset link     │         │  token function      │         │  in database    │
└─────────────────┘         └──────────────────────┘         └─────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              ┌─────────┐      ┌───────────┐     ┌───────────┐
              │ Valid   │      │ Expired   │     │ Invalid   │
              │ Show    │      │ Show      │     │ Show      │
              │ form    │      │ error +   │     │ error +   │
              │         │      │ request   │     │ request   │
              │         │      │ new link  │     │ new link  │
              └─────────┘      └───────────┘     └───────────┘
```

### 2. Update ResetPassword.tsx

Add states and useEffect to validate on mount:

| New State | Purpose |
|-----------|---------|
| `validating` | Show loading spinner while checking token |
| `tokenStatus` | `'valid'` \| `'expired'` \| `'used'` \| `'invalid'` |

**Flow:**
1. Page loads → Show "Validating your reset link..." spinner
2. Call `validate-reset-token` edge function
3. If valid → Show password form
4. If expired/used/invalid → Show appropriate error message with "Request New Link" button

---

## User Experience

| Scenario | Before | After |
|----------|--------|-------|
| Valid token | Form shown | Brief loading → Form shown |
| Expired token | Form shown, error after submit | "This link has expired" + Request New Link button |
| Used token | Form shown, error after submit | "This link was already used" + Request New Link button |
| Invalid token | Form shown, error after submit | "Invalid reset link" + Request New Link button |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/validate-reset-token/index.ts` | Create new edge function |
| `src/pages/ResetPassword.tsx` | Add token validation on mount |

---

## Edge Function Details

**`validate-reset-token`** will:
1. Accept `{ token: string }` in request body
2. Hash the token with SHA-256
3. Query `password_reset_tokens` table
4. Return one of:
   - `{ status: 'valid' }` - Token exists, not used, not expired
   - `{ status: 'expired' }` - Token exists but past expiry time
   - `{ status: 'used' }` - Token exists but already used
   - `{ status: 'invalid' }` - Token not found

This is read-only and doesn't consume the token - it just checks validity.

