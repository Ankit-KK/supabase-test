

# Fix CSP to Allow `.supabase.com` Connections

## Problem
The Content Security Policy in `index.html` only allows `https://*.supabase.co` and `wss://*.supabase.co` in the `connect-src` directive. After switching endpoints to `.supabase.com`, all Supabase requests are blocked by the browser.

## Fix

### `index.html` - Update CSP `connect-src`

Add `https://*.supabase.com` and `wss://*.supabase.com` alongside the existing `.co` entries (keep `.co` for backward compatibility during any transition):

```
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.com wss://*.supabase.com https://*.pusher.com wss://*.pusher.com https://*.cashfree.com https://*.razorpay.com
```

Also update `media-src` to include `.supabase.com`:
```
media-src 'self' https://*.supabase.co https://*.supabase.com https://*.r2.dev blob:
```

### No other files changed
- No edge functions modified
- No streamer pages affected

