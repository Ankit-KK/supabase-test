

# Fix: update-streamer-settings RPC Parameter Name Mismatch

## Root Cause

The edge function logs show:

```
Could not find the function public.validate_session_token(p_token) in the schema cache
Perhaps you meant to call the function public.validate_session_token(plain_token)
```

On line 33 of `update-streamer-settings/index.ts`, the RPC is called with parameter name `p_token`, but the database function expects `plain_token`.

## Fix

**File: `supabase/functions/update-streamer-settings/index.ts`** (line 33)

Change:
```
.rpc('validate_session_token', { p_token: authToken });
```
To:
```
.rpc('validate_session_token', { plain_token: authToken });
```

Single line change. Redeploy the edge function after.

