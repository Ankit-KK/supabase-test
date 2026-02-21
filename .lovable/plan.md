

## Clear Rate Limit Entries for Password Reset Testing

### What's Happening
The rate limiter is blocking your password reset attempts because you've already hit the 3-requests-per-hour limit. The fix to use `@hyperchat.space` is deployed but hasn't been tested yet because requests never reach the Resend API.

### Action
Delete the rate limit entries related to password reset from the `rate_limits` table using a SQL delete operation:

```sql
DELETE FROM rate_limits WHERE endpoint LIKE 'password_reset%';
```

This will clear both the IP-based and email-based rate limit entries, allowing you to immediately test the password reset flow with the corrected sender domain.

### After Clearing
You should be able to request a password reset and verify that:
1. The edge function reaches the Resend API call
2. Resend shows the request in its logs
3. The email arrives successfully

