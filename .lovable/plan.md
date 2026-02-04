
# Plan: Improve Error Handling for Password Reset

## Problem

When the `reset-password` edge function returns an error (like "Reset link already used"), the frontend shows a generic "Edge Function returned a non-2xx status code" message instead of the actual helpful error message.

## Root Cause

The Supabase `functions.invoke` method has specific behavior for non-2xx responses:
- When a function returns non-2xx, the `error` object contains a generic message
- The actual response body with the detailed error is in `data` (even on errors)

| Current Behavior | Expected Behavior |
|------------------|-------------------|
| "Edge Function returned a non-2xx status code" | "This reset link has already been used. Please request a new one." |

## Solution

Update both password reset pages to properly extract error messages from edge function responses:

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ResetPassword.tsx` | Better error extraction from `data.error` and `fnError` |
| `src/pages/ForgotPassword.tsx` | Already handles errors silently (by design) - minor improvement |

---

## Technical Details

### ResetPassword.tsx Changes

**Current code (lines 75-115):**
```typescript
const { data, error: fnError } = await supabase.functions.invoke('reset-password', {
  body: { token, newPassword: formData.password }
});

if (fnError) {
  const errorMessage = fnError.message || 'Failed to reset password';
  setError(errorMessage);
  // Shows generic "Edge Function returned a non-2xx status code"
}
```

**Fixed code:**
```typescript
const { data, error: fnError } = await supabase.functions.invoke('reset-password', {
  body: { token, newPassword: formData.password }
});

// Extract the actual error message from the response
let errorMessage: string | null = null;

if (data?.error) {
  // Error returned in response body (most common case)
  errorMessage = data.error;
} else if (fnError) {
  // Try to parse error context for the actual message
  try {
    const errorContext = fnError.context;
    if (errorContext?.body) {
      const parsed = JSON.parse(errorContext.body);
      errorMessage = parsed.error || fnError.message;
    } else {
      errorMessage = fnError.message || 'Failed to reset password. Please try again.';
    }
  } catch {
    errorMessage = 'Failed to reset password. Please try again.';
  }
}

if (errorMessage) {
  setError(errorMessage);
  toast({ title: "Reset Failed", description: errorMessage, variant: "destructive" });
} else {
  setSuccess(true);
  toast({ title: "Password Reset!", description: "Your password has been reset successfully." });
}
```

### Key Improvements

1. **Priority order for error extraction:**
   - First check `data.error` (response body error)
   - Then check `fnError.context.body` (parsed error context)
   - Finally fallback to generic message

2. **User-friendly messages:**
   - "This reset link has already been used. Please request a new one."
   - "This reset link has expired. Please request a new one."
   - "Invalid reset link. Please request a new one."

---

## Summary

| Before | After |
|--------|-------|
| "Edge Function returned a non-2xx status code" | "This reset link has already been used. Please request a new one." |
| Generic error for all failures | Specific, actionable error messages |
