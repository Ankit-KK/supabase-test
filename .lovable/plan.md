
# Plan: Enable Admin Login for All Dashboards

## Problem

The `admin_emails` table exists with `admin@example.com` but admin login doesn't work because:
- Your app uses a **custom auth system** (`auth_users` + `auth_sessions` tables)
- The `get_user_streamers()` function uses `auth.email()` to check admin status
- `auth.email()` is a Supabase Auth function that returns `NULL` since you're not using Supabase Auth
- Result: Admin email checks always fail, even for valid admins

## Current Flow (Broken)

```text
User logs in → Custom session created → Dashboard loads
                                              ↓
                                    get_user_streamers(user_id)
                                              ↓
                                    is_admin_email(auth.email())
                                              ↓
                                    auth.email() = NULL ← Problem!
                                              ↓
                                    Admin check fails
```

## Solution

Update the system to pass the user's email (which we have from custom auth) instead of relying on `auth.email()`.

### Changes Required

| Component | Change |
|-----------|--------|
| Database function | Modify `get_user_streamers()` to accept email parameter |
| Dashboard.tsx | Pass user email when calling the RPC |
| StreamerDashboardWrapper.tsx | Pass user email when calling the RPC |

---

## Technical Details

### 1. Database Migration

Update `get_user_streamers()` function to accept email as a parameter:

```sql
CREATE OR REPLACE FUNCTION public.get_user_streamers(
  p_user_id uuid,
  p_user_email text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  streamer_slug text, 
  streamer_name text,
  brand_color text,
  is_owner boolean,
  is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    (s.user_id = p_user_id) as is_owner,
    -- Use provided email or fallback to auth.email()
    public.is_admin_email(COALESCE(p_user_email, auth.email())) as is_admin
  FROM public.streamers s
  WHERE s.user_id = p_user_id 
     OR public.is_admin_email(COALESCE(p_user_email, auth.email()));
END;
$$;
```

### 2. Frontend Changes

**Dashboard.tsx** (lines 30-33):
```typescript
// Before
const { data, error } = await supabase.rpc('get_user_streamers', {
  p_user_id: user.id
});

// After
const { data, error } = await supabase.rpc('get_user_streamers', {
  p_user_id: user.id,
  p_user_email: user.email  // Pass email for admin check
});
```

**StreamerDashboardWrapper.tsx** (lines 33-35):
```typescript
// Before
const { data } = await supabase.rpc('get_user_streamers', {
  p_user_id: user.id
});

// After
const { data } = await supabase.rpc('get_user_streamers', {
  p_user_id: user.id,
  p_user_email: user.email  // Pass email for admin check
});
```

---

## How Admin Login Will Work After Fix

```text
Admin logs in → Custom session created → Dashboard loads
                     ↓                         ↓
              user.email = "admin@example.com"
                                               ↓
                                    get_user_streamers(user_id, user_email)
                                               ↓
                                    is_admin_email("admin@example.com")
                                               ↓
                                    Found in admin_emails table!
                                               ↓
                                    Returns ALL streamers with is_admin=true
                                               ↓
                                    Admin sees all dashboards
```

---

## Setup Steps

To add a new admin, insert their email into the `admin_emails` table:

```sql
INSERT INTO admin_emails (email) VALUES ('your-admin@email.com');
```

Then they can:
1. Register/Login with that email on the auth page
2. Access `/dashboard` and see ALL streamer dashboards
3. Manage any streamer's settings, donations, etc.

---

## Files to Modify

| File | Action |
|------|--------|
| Database migration | Add `p_user_email` parameter to `get_user_streamers()` |
| `src/pages/dashboard/Dashboard.tsx` | Pass `user.email` to RPC call |
| `src/components/dashboard/StreamerDashboardWrapper.tsx` | Pass `user.email` to RPC call |

---

## Security Considerations

- The `is_admin_email()` function remains `SECURITY DEFINER` with restricted access
- Admin emails table is protected and cannot be enumerated
- The email parameter is only used for the admin check, not to grant access to arbitrary streamers
- Non-admin users will only see their own streamer (matched by `user_id`)
