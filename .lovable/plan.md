

# Security Hardening: Block Unauthorized Database Insertions and Access

## Problem Summary

The attacker exploited **publicly accessible Edge Functions** that use the `service_role` key internally but have **zero authentication checks**. This allowed them to:

1. **Create fake accounts** in `auth_users` by calling `authenticate-user` with `action: 'register'` -- anyone can register
2. **Approve/reject/replay donations** via `moderate-donation` -- no auth required at all
3. **View all pending donations** via `get-moderation-queue` -- no auth required

The RLS policies on `auth_users` are actually correct (they block direct anon/authenticated access). The problem is that Edge Functions bypass RLS because they use `service_role`, and the functions themselves don't verify who is calling them.

## Fix Plan

### 1. Lock down `authenticate-user` registration

Currently anyone can call `register` to create accounts. Fix:

- **Disable open registration entirely** -- only allow `login` action from public calls
- Registration should only be possible through an admin-protected flow or be completely removed if not needed
- Alternative: Add an invite code / admin approval requirement for registration

### 2. Add JWT authentication to `moderate-donation`

This is the most critical fix. Currently anyone can call this function to approve donations, change moderation status, ban donors, etc.

- Extract `Authorization` header and verify JWT via `supabase.auth.getUser()`
- Verify the authenticated user owns the streamer (check `streamers.user_id`) OR is a valid moderator
- For `source: 'telegram'` calls, validate using a shared secret header instead of JWT (since Telegram webhook calls won't have a user JWT)

### 3. Add JWT authentication to `get-moderation-queue`

Currently anyone can view all pending donations for any streamer.

- Extract `Authorization` header and verify JWT
- Verify the authenticated user owns the streamer or is a registered moderator for that streamer

### 4. Review `generate-obs-token`

This function already checks access via `get_streamer_by_email` RPC, but it trusts the `user_email` parameter from the request body (the caller can pass any email). Fix:

- Use JWT auth to get the actual authenticated user's email instead of trusting the request body

## Technical Details

### `authenticate-user/index.ts`

```
// At the start of the register action handler:
// Option A: Disable registration entirely
if (action === 'register') {
  return new Response(
    JSON.stringify({ error: 'Registration is currently disabled' }),
    { status: 403, headers: corsHeaders }
  );
}

// Option B: Require admin authorization for registration
const authHeader = req.headers.get('Authorization');
// ... verify JWT, check admin role ...
```

### `moderate-donation/index.ts`

```
// After CORS check, before processing:
// For dashboard source: require JWT auth
if (source === 'dashboard' || !source) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return 401;
  
  // Verify JWT
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await userClient.auth.getUser(token);
  if (!user) return 401;
  
  // Verify user owns the streamer
  const streamer = await supabaseAdmin.from('streamers')
    .select('user_id').eq('id', streamerId).single();
  if (streamer.user_id !== user.id) return 403;
}

// For telegram source: validate with internal secret
if (source === 'telegram') {
  const internalSecret = req.headers.get('x-internal-secret');
  if (internalSecret !== Deno.env.get('INTERNAL_FUNCTION_SECRET')) return 403;
}
```

### `get-moderation-queue/index.ts`

```
// After CORS check:
const authHeader = req.headers.get('Authorization');
if (!authHeader) return 401;

const token = authHeader.replace('Bearer ', '');
const { data: { user } } = await userClient.auth.getUser(token);
if (!user) return 401;

// Verify ownership of the streamer
const streamer = await supabaseAdmin.from('streamers')
  .select('user_id').eq('id', streamerId).single();
if (streamer.user_id !== user.id) return 403;
```

### `generate-obs-token/index.ts`

```
// Replace trusting request body email with JWT verification:
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
const { data: { user } } = await userClient.auth.getUser(token);
// Use user.email instead of body.user_email
```

## Implementation Order

1. `authenticate-user` -- disable/restrict registration (stops account creation attack)
2. `moderate-donation` -- add auth (stops unauthorized donation manipulation)
3. `get-moderation-queue` -- add auth (stops data leakage)
4. `generate-obs-token` -- fix email trust issue

## Impact

- No impact on legitimate dashboard users (they already send auth headers)
- Telegram moderation continues to work (uses internal secret validation)
- Blocks all unauthorized account creation, donation manipulation, and data access

