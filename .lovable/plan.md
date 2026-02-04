

# Plan: Fix Email Domain Mismatch

## Problem

The password reset email is failing because of a domain mismatch:

| Setting | Current Value | Your Resend Verified Domain |
|---------|---------------|----------------------------|
| From address | `noreply@hyperchat.live` | `hyperchat.site` |

Resend requires that the "from" domain matches a verified domain in your account.

---

## Solution

Update the edge function to use your verified domain `hyperchat.site`.

---

## File to Modify

**`supabase/functions/request-password-reset/index.ts`**

Change line ~131:
```typescript
// Before
from: 'HyperChat <noreply@hyperchat.live>',

// After  
from: 'HyperChat <noreply@hyperchat.site>',
```

---

## Quick Fix

This is a one-line change - update the `from` address from `hyperchat.live` to `hyperchat.site`.

---

## After the Fix

1. Deploy the updated edge function
2. Test password reset again
3. Email should send successfully from `noreply@hyperchat.site`

