

# Audit and Clean Sensitive Console Logs

## Findings Summary

| File | Severity | Issue |
|------|----------|-------|
| `src/components/dashboard/OBSTokenManager.tsx` | **CRITICAL** | Logs full OBS token objects to browser console (visible to anyone with DevTools) |
| `supabase/functions/authenticate-user/index.ts` | Medium | Logs user email during password hash upgrade |
| `supabase/functions/request-password-reset/index.ts` | Medium | Logs user emails during reset flow |
| `supabase/functions/reset-password/index.ts` | Medium | Logs user email on successful reset |

## Changes

### 1. OBSTokenManager.tsx (Critical Fix)

Remove or redact all sensitive console.log statements:

- Line 201: `console.log('Fetching OBS tokens for streamer:', streamerId)` -- Keep (no sensitive data)
- Line 215: `console.log('Successfully fetched tokens:', data)` -- **Remove** (leaks token values)
- Line 248: `console.log('Generating OBS token for streamer:', streamerId, 'user:', user.id)` -- Redact user.id
- Line 295: `console.log('Fetched tokens after generation:', updatedTokens)` -- **Remove** (leaks token values)

### 2. authenticate-user/index.ts

- Line 200: Change `console.log('Upgrading plaintext password to bcrypt for user:', user.email)` to remove the email, log only `'Upgrading password hash for user'`

### 3. request-password-reset/index.ts

- Line 80: Remove email from rate limit log
- Line 97: Remove email from "non-existent" log
- Line 209: Remove email from "sent successfully" log

### 4. reset-password/index.ts

- Line 148: Remove email from success log

## Approach

- Replace sensitive data in logs with safe identifiers (e.g., user ID prefix or just a count)
- Keep non-sensitive logs intact for debugging
- No functional changes -- only log content is modified

