

# Plan: Add IP-Based Rate Limiting for Password Reset

## Problem

The current rate limiting in `request-password-reset` only limits requests **per email address**:
```typescript
p_endpoint: `password_reset_${normalizedEmail}`,  // Per-email limit
```

**Abuse scenario:** An attacker could send password reset requests for thousands of different email addresses from the same IP address, potentially:
- Exhausting your Resend email quota
- Harassing users with unwanted reset emails
- Causing costs to spike

## Solution

Add a **two-layer rate limiting** approach:

| Layer | Limit | Purpose |
|-------|-------|---------|
| **IP-based** | 10 requests/hour per IP | Prevents bulk abuse from single source |
| **Email-based** | 3 requests/hour per email | Prevents spamming a specific user |

Both checks must pass before sending an email.

---

## File to Modify

**`supabase/functions/request-password-reset/index.ts`**

### Changes (around line 49-65):

Add IP-based rate limit check **before** the email-based check:

```typescript
const normalizedEmail = email.trim().toLowerCase();
const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                 req.headers.get('x-real-ip') || 'unknown';

// Layer 1: IP-based rate limiting (10 requests/hour per IP)
// Prevents bulk abuse from a single source
const { data: ipRateLimitOk } = await supabase.rpc('check_rate_limit_v2', {
  p_endpoint: 'password_reset_ip',
  p_ip_address: clientIP,
  p_max_requests: 10,
  p_window_seconds: 3600
});

if (!ipRateLimitOk) {
  console.log(`IP rate limit exceeded for password reset from: ${clientIP}`);
  return new Response(
    JSON.stringify({ message: 'If an account exists with this email, a reset link has been sent.' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Layer 2: Email-based rate limiting (3 requests/hour per email)
// Prevents spamming a specific user
const { data: emailRateLimitOk } = await supabase.rpc('check_rate_limit_v2', {
  p_endpoint: `password_reset_email_${normalizedEmail}`,
  p_ip_address: clientIP,
  p_max_requests: 3,
  p_window_seconds: 3600
});

if (!emailRateLimitOk) {
  console.log(`Email rate limit exceeded for password reset: ${normalizedEmail}`);
  return new Response(
    JSON.stringify({ message: 'If an account exists with this email, a reset link has been sent.' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

## Rate Limit Summary

| Scenario | Limit | Window |
|----------|-------|--------|
| Same IP, different emails | 10 total requests | 1 hour |
| Same email, any IP | 3 requests | 1 hour |

This protects against:
- Bulk email abuse (hitting 10 different users = IP blocked for an hour)
- Targeted harassment (hitting same email 3 times = email blocked for an hour)

---

## Technical Details

- Uses the existing `check_rate_limit_v2` database function
- Extracts client IP properly from proxy headers (`x-forwarded-for`, `x-real-ip`)
- Returns the same generic success message to avoid information leakage
- Logs rate limit violations for monitoring

