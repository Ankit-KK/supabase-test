

# Fix Discord "This interaction failed" -- Respond Before Processing

## Problem
Discord requires interaction responses within **3 seconds**. Currently, `discord-webhook` awaits the `moderate-donation` edge function (which performs DB updates, TTS generation, Pusher events, etc.) before responding. The moderation action succeeds, but Discord times out and shows "This interaction failed."

## Solution
**Respond immediately, then process in the background.** Fire the `moderate-donation` fetch without awaiting it, and return the Discord response (type 7 -- UPDATE_MESSAGE) right away. The moderation call will continue executing in the background.

## Changes

### `supabase/functions/discord-webhook/index.ts`

Replace the current `await fetch(...)` + result check block (lines 174-219) with:

1. **Fire-and-forget** the `moderate-donation` call (no `await`)
2. **Immediately return** the type 7 UPDATE_MESSAGE response with the success message and empty buttons

```typescript
// Fire moderate-donation WITHOUT awaiting -- respond to Discord immediately
fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/moderate-donation`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  },
  body: JSON.stringify({
    action,
    donationId: mapping.donation_id,
    donationTable: mapping.table_name,
    streamerId: mapping.streamer_id,
    moderatorId: moderator.id,
    moderatorName: moderator.mod_name || userName,
    source: 'discord'
  })
}).catch(err => console.error('Background moderate-donation error:', err));

const emoji = actionEmojis[action] || '✅';
const label = actionLabels[action] || action;

return new Response(JSON.stringify({
  type: 7,
  data: {
    content: `${emoji} **${label}** by ${moderator.mod_name || userName}`,
    components: []
  }
}), { headers: { 'Content-Type': 'application/json' } });
```

This ensures Discord gets its response in under 100ms while the moderation action processes in the background.

## Technical Summary
- 1 file modified: `supabase/functions/discord-webhook/index.ts`
- Redeploy `discord-webhook`
- No other files touched

