

# Plan: Fix bcrypt Worker Error in Password Reset

## Problem

The `reset-password` edge function is failing with:
```
ReferenceError: Worker is not defined
at Module.hash (https://deno.land/x/bcrypt@v0.4.1/src/main.ts:11:16)
```

The async `bcrypt.hash()` method uses Web Workers internally, but **Supabase Edge Functions don't support Web Workers**.

## Root Cause

| File | Current Method | Issue |
|------|---------------|-------|
| `reset-password/index.ts` | `await bcrypt.hash(newPassword, 12)` | Uses Workers (fails) |
| `authenticate-user/index.ts` | `bcrypt.hashSync(password, salt)` | Sync method (works) |

## Solution

Update `reset-password` to use the synchronous bcrypt methods, matching the pattern already working in `authenticate-user`.

## File to Modify

**`supabase/functions/reset-password/index.ts`**

### Change at line 114:

```typescript
// Before (async - uses Workers, fails)
const passwordHash = await bcrypt.hash(newPassword, 12);

// After (sync - no Workers, works)
const salt = bcrypt.genSaltSync(12);
const passwordHash = bcrypt.hashSync(newPassword, salt);
```

## Why This Works

- `bcrypt.genSaltSync()` and `bcrypt.hashSync()` are synchronous methods that don't require Web Workers
- This is the exact pattern used in `authenticate-user/index.ts` (lines 85-86) which works correctly
- Same security level (12 rounds of bcrypt hashing)

## Summary

| Before | After |
|--------|-------|
| `await bcrypt.hash(newPassword, 12)` | `const salt = bcrypt.genSaltSync(12);`<br>`const passwordHash = bcrypt.hashSync(newPassword, salt);` |

