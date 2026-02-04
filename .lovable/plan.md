

# Plan: Update Password Reset Link to Use hyperchat.site

## Problem

The password reset email contains a link to the Lovable preview domain instead of your production domain:

| Current URL | Should Be |
|-------------|-----------|
| `https://hyper-chat.lovable.app/reset-password?token=...` | `https://hyperchat.site/reset-password?token=...` |

## Solution

Update line 122 in `supabase/functions/request-password-reset/index.ts`:

```typescript
// Before
const resetUrl = `https://hyper-chat.lovable.app/reset-password?token=${plainToken}`;

// After  
const resetUrl = `https://hyperchat.site/reset-password?token=${plainToken}`;
```

## File to Modify

| File | Change |
|------|--------|
| `supabase/functions/request-password-reset/index.ts` | Update `resetUrl` on line 122 |

## Result

Password reset emails will contain links pointing to your production domain `hyperchat.site`, allowing users to reset their passwords through the proper URL.

