
Objective
Keep India compatibility by continuing to use the custom Supabase domain as primary, while adding a safe fallback path so logins still work when proxy/CORS issues happen for some users.

What I found
- Current frontend is hardcoded to `https://supabase.hyperchat.space` in:
  - `src/integrations/supabase/client.ts`
  - `src/components/audio-player/MediaSourcePlayer.tsx`
  - `src/components/dashboard/OBSTokenManager.tsx`
- `authenticate-user` edge function already returns proper CORS headers (`Access-Control-Allow-Origin: *`), so failures are upstream/proxy path related.
- Your requirement is valid: we should not switch globally to `.supabase.co`, because India users depend on the custom domain.

Implementation plan
1) Add resilient transport in Supabase client (primary custom domain + network-only fallback)
- File: `src/integrations/supabase/client.ts`
- Keep primary base URL as `https://supabase.hyperchat.space`.
- Use direct project URL (`import.meta.env.VITE_SUPABASE_URL`, fallback to `.supabase.co`) as secondary URL.
- Create `fetchWithFailover` and pass it to `createClient(..., { global: { fetch } })`.
- Retry only when the first request throws network-level errors (CORS/preflight/ERR_FAILED/TypeError), not on HTTP responses.
- Preserve request method/headers/body with `Request.clone()` to keep behavior consistent.
- Add concise console warning when fallback is used (for debugging).

2) Centralize URL for manually generated function links
- File: `src/integrations/supabase/client.ts`
- Export a small helper/constant for “preferred functions base URL” (custom domain).
- This keeps OBS/media URLs intentionally on custom domain (important for India).

3) Remove hardcoded proxy strings in UI components
- File: `src/components/audio-player/MediaSourcePlayer.tsx`
- File: `src/components/dashboard/OBSTokenManager.tsx`
- Replace literal `https://supabase.hyperchat.space/...` with the shared exported base URL helper.
- Behavior remains same for users; avoids scattered hardcoded endpoints.

4) Keep existing CSP as-is
- No additional `index.html` changes needed for this pass (both domains already allowed in `connect-src` and `media-src`).

Validation plan
- Test login end-to-end on both `hyperchat.space` and `hyperchat.site`.
- Confirm requests try custom domain first.
- Simulate/observe proxy failure path and confirm automatic retry to `.supabase.co` succeeds where available.
- Confirm existing session validation (`validate_session_token`) still works.
- Confirm OBS/media source URLs still generate using custom domain.
- Smoke-test key dashboard function calls to ensure no regressions.

Risk handling
- This avoids breaking India access because custom domain stays primary.
- If custom proxy is hard-down and `.supabase.co` is blocked for an India user, login may still fail; this is expected and indicates infra-level proxy outage.
- Long-term recommended infra follow-up: fix proxy CORS/host forwarding so fallback is rarely needed.
