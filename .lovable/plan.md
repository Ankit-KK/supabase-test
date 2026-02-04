

# Plan: Add Password Reset Flow for Custom Auth

## Overview

Implement a secure password reset process for the custom authentication system. Since you have a custom `auth_users` table (not using Supabase Auth), we need to build the complete flow from scratch.

---

## Architecture

### Password Reset Flow

```text
User clicks "Forgot Password"
           |
           v
+------------------------+
|  Enter Email Address   |
+------------------------+
           |
           v
+------------------------+
|  Edge Function:        |
|  request-password-reset|
|  - Verify email exists |
|  - Generate token      |
|  - Store hashed token  |
|  - Send email          |
+------------------------+
           |
           v
     User receives email
     with reset link
           |
           v
+------------------------+
|  /reset-password?token=|
|  - Enter new password  |
|  - Confirm password    |
+------------------------+
           |
           v
+------------------------+
|  Edge Function:        |
|  reset-password        |
|  - Validate token      |
|  - Update password     |
|  - Invalidate token    |
+------------------------+
           |
           v
     Redirect to Login
```

---

## Components Required

### 1. Database Migration

Add a `password_reset_tokens` table to store reset tokens securely:

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,  -- Store hashed, not plaintext
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- RLS policies
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
```

### 2. Edge Function: `request-password-reset`

Handles the "Forgot Password" request:

- Validates email exists in `auth_users`
- Generates secure random token
- Stores hashed token with 1-hour expiry
- Sends email via Resend with reset link
- Rate limited (3 requests per hour per email)

### 3. Edge Function: `reset-password`

Handles the actual password reset:

- Validates token exists and not expired
- Validates token not already used
- Updates password with bcrypt hash
- Marks token as used
- Clears any account lockouts

### 4. Frontend Pages

**Forgot Password View** (add to Auth.tsx):
- Email input form
- "Send Reset Link" button
- Success message after sending

**Reset Password Page** (`/reset-password`):
- New password input
- Confirm password input
- Token validation from URL
- Success redirect to login

---

## Email Service Requirement

**Important:** You'll need a **Resend API key** to send password reset emails.

Current secrets show only `TELEGRAM_BOT_TOKEN` - no email service configured.

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| **Resend** (Recommended) | Free tier, simple API, React Email support | Requires domain verification |
| **Admin Reset Only** | No email needed | Manual process |

For full password reset flow, you'll need to:
1. Create account at [resend.com](https://resend.com)
2. Verify a domain (or use `onboarding@resend.dev` for testing)
3. Create API key and add as secret `RESEND_API_KEY`

---

## Files to Create/Modify

| File | Type | Description |
|------|------|-------------|
| `supabase/migrations/XXXXXX_add_password_reset_tokens.sql` | NEW | Database table for tokens |
| `supabase/functions/request-password-reset/index.ts` | NEW | Request reset + send email |
| `supabase/functions/reset-password/index.ts` | NEW | Validate token + update password |
| `src/pages/ResetPassword.tsx` | NEW | Reset password form page |
| `src/pages/Auth.tsx` | MODIFY | Add "Forgot Password?" link |
| `src/contexts/AuthContext.tsx` | MODIFY | Add `requestPasswordReset` method |
| `src/App.tsx` | MODIFY | Add `/reset-password` route |
| `supabase/config.toml` | MODIFY | Add verify_jwt = false for new functions |

---

## Security Features

1. **Token Security**
   - Tokens stored as SHA-256 hash (not plaintext)
   - 1-hour expiration
   - Single-use (marked after use)
   - Cryptographically secure random generation

2. **Rate Limiting**
   - 3 reset requests per hour per email
   - Uses existing `check_rate_limit_v2` function

3. **Password Requirements**
   - Minimum 6 characters (matching signup)
   - Bcrypt hashing with 12 rounds

4. **Account Security**
   - Clears failed login attempts on reset
   - Removes account lockout on reset

---

## User Flow

### Requesting Reset

1. User clicks "Forgot Password?" on login page
2. Modal/form appears asking for email
3. User enters email and clicks "Send Reset Link"
4. Success message: "If an account exists, a reset link has been sent"
5. Email arrives with link: `https://hyper-chat.lovable.app/reset-password?token=xxx`

### Resetting Password

1. User clicks link in email
2. Lands on `/reset-password?token=xxx`
3. Enters new password twice
4. Clicks "Reset Password"
5. Success toast + redirect to login
6. User logs in with new password

---

## Prerequisite: Email Service

Before implementing, you need to set up Resend:

1. Sign up at https://resend.com
2. Add a verified domain OR use testing domain
3. Create API key
4. Add secret: `RESEND_API_KEY`

Would you like me to proceed with this plan once you have the Resend API key ready?

