

## Add BRIGZARD Auth Credentials and Link to Dashboard

### What will be done

Create a new login account for BRIGZARD using placeholder credentials and link it to the streamer record so the dashboard is accessible.

### Credentials

- **Email**: `brigzard@hyperchat.com`
- **Password**: `BrigzardTemp123!` (plaintext -- will auto-upgrade to bcrypt on first login)

### Database Changes

A single INSERT into `auth_users`:

```sql
INSERT INTO auth_users (email, password_hash, username, role, streamer_id, is_active)
VALUES (
  'brigzard@hyperchat.com',
  'BrigzardTemp123!',
  'brigzard',
  'user',
  'adb22f13-08b9-4b93-8fcc-4336ebd0f7a2',
  true
);
```

- `streamer_id` is set to BRIGZARD's ID from the `streamers` table (`adb22f13-...`)
- The password is stored as plaintext initially and will be automatically upgraded to a bcrypt hash on first successful login (existing platform behavior)
- Role is `user` (matching other streamers like Zishu, Wolfy, etc.)

### No Code Changes Required

The existing `StreamerDashboardWrapper` and `Dashboard.tsx` already use the `get_user_streamers` RPC which checks `auth_users.streamer_id` to grant access. Once the row is inserted, logging in at `/auth` with these credentials will grant access to `/dashboard/brigzard`.

### Post-Setup

After implementation, you can:
1. Go to `/auth` and log in with `brigzard@hyperchat.com` / `BrigzardTemp123!`
2. You'll be auto-redirected to `/dashboard/brigzard`
3. Change the password later via the reset password flow

