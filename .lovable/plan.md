

## Diagnosis: `moderate-donation` 404 via Proxy

The `moderate-donation` edge function exists, is configured in `config.toml`, and logs show it has been executing recently (see the edge function logs in the context). The 404 is specifically from `https://supabase.hyperchat.space/functions/v1/moderate-donation`.

**Root cause options:**
1. **Proxy misconfiguration** — the custom domain `supabase.hyperchat.space` may have stale routing or the function path isn't being forwarded. This is outside Lovable's control (it's your DNS/proxy setup).
2. **Function not deployed** — the function code exists but may not be currently deployed to Supabase.

**Verification step:** The edge function logs from context show `moderate-donation` booted and ran recently (it even logged a moderation request). So the function IS deployed. The 404 is from the proxy layer.

### Fix Options

**Option A: Redeploy the edge function**
Use the deploy tool to redeploy `moderate-donation`. This ensures it's live.

**Option B: Check the proxy**
Verify that `supabase.hyperchat.space` correctly proxies all paths to `vsevsjvtrshgeiudrnth.supabase.co`. The 404 may be from the proxy itself (e.g., Cloudflare, Vercel, or whatever reverse proxy is in front) rather than Supabase.

**Option C: No code changes needed**
The failover logic in `client.ts` only retries on network errors (TypeError), not HTTP 404s. If the proxy intermittently returns 404, the failover won't help. However, since this is a proxy issue, the right fix is fixing the proxy — not changing client code.

### Recommended Action
1. **Redeploy `moderate-donation`** to ensure it's live
2. If 404 persists, the issue is with the `supabase.hyperchat.space` proxy configuration — check your DNS/CDN settings for that domain

