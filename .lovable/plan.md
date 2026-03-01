

# Fix Content Security Policy for Custom Supabase Domain

## Problem
The `connect-src` directive in `index.html` only allows `*.supabase.co` and `*.supabase.com`. Since the Supabase client now uses `supabase.hyperchat.space`, the browser's CSP blocks all API calls (auth, RPC, edge functions), breaking the entire app.

## Solution
Update the CSP `connect-src` in `index.html` to include `https://supabase.hyperchat.space`.

## File Change

**`index.html`** -- In the Content-Security-Policy meta tag, add `https://supabase.hyperchat.space` to the `connect-src` directive:

```
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.com wss://*.supabase.com https://supabase.hyperchat.space https://*.pusher.com wss://*.pusher.com https://*.cashfree.com https://*.razorpay.com;
```

Also add it to `media-src` so audio/video from the proxy domain works:

```
media-src 'self' https://*.supabase.co https://*.supabase.com https://supabase.hyperchat.space https://*.r2.dev blob:;
```

## Impact
- All API calls through the proxy domain will be allowed
- No other files changed
- Existing `*.supabase.co` entries kept for backward compatibility

