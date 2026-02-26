

# Store Discord Link as a Secret

## Why Secrets Over Database
- No new table needed
- Simpler to manage via Supabase Secrets dashboard
- Already the pattern used for other config (Pusher keys, API keys, etc.)

## Changes

### 1. Add Secret
- Store `DISCORD_INVITE_LINK` as a Supabase secret (e.g., value: `https://discord.gg/your-invite`)

### 2. New Edge Function: `get-discord-link`
A minimal edge function that reads the secret and returns it:
- File: `supabase/functions/get-discord-link/index.ts`
- Reads `DISCORD_INVITE_LINK` from `Deno.env.get()`
- Returns `{ url: "https://discord.gg/..." }`
- Includes standard CORS headers
- Falls back to empty string if not set

### 3. Update Frontend: `src/components/SignupDialog.tsx`
- Remove hardcoded `DISCORD_INVITE_LINK` constant
- Fetch from the edge function when dialog opens (in the options view)
- Show a brief loading state on the Discord button while fetching
- Cache the result so repeated opens don't re-fetch
- Fallback: if fetch fails, disable the Discord button or show a toast

## No Other Changes
- No database migrations
- No other components or edge functions modified
- Streamer pages untouched

