

# Fix: Update "Request New Reset Link" Navigation

## Problem

The "Request New Reset Link" button on the password reset page navigates to `/forgot-password`, which doesn't exist. The correct route is `/reset-password-request`.

## Root Cause

In `src/pages/ResetPassword.tsx` at line 169:
```typescript
const goToForgotPassword = () => {
  navigate('/forgot-password');  // Wrong route
};
```

But in `App.tsx`, the ForgotPassword component is registered at:
```typescript
<Route path="/reset-password-request" element={<ForgotPassword />} />
```

## Solution

Update the navigation path in `ResetPassword.tsx`:

| File | Line | Change |
|------|------|--------|
| `src/pages/ResetPassword.tsx` | 169 | Change `/forgot-password` to `/reset-password-request` |

## Code Change

```typescript
const goToForgotPassword = () => {
  navigate('/reset-password-request');  // Correct route
};
```

This is a one-line fix that will correctly redirect users to the password reset request page when their token is invalid, expired, or already used.

