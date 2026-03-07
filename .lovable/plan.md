

## Plan: Add `.env` to `.gitignore` + Remove Hardcoded Credentials from `client.ts`

### Changes

**1. `.gitignore` — append env patterns**

Add at the end:
```
# Environment files
.env
.env.*
```

**2. `src/integrations/supabase/client.ts` — use environment variables**

Replace the hardcoded values:
- `PRIMARY_URL` → read from `import.meta.env.VITE_SUPABASE_URL` with the custom domain as default
- `SUPABASE_PUBLISHABLE_KEY` → read from `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`

The `.env` file already has these variables defined, and Lovable auto-populates them for connected Supabase projects. The custom domain (`supabase.hyperchat.space`) stays as the primary URL default, with the env var as fallback URL.

Updated logic:
```ts
const PRIMARY_URL = "https://supabase.hyperchat.space";
const FALLBACK_URL = import.meta.env.VITE_SUPABASE_URL || "https://vsevsjvtrshgeiudrnth.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

The anon key is already available via the Lovable-managed `.env`, so no hardcoded fallback is needed.

### Manual Step Required

After merging, remove the already-tracked `.env` from Git:
- GitHub UI: navigate to `.env` → delete, or
- Locally: `git rm --cached .env && git commit -m "Remove .env from tracking" && git push`

