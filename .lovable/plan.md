

# Plan: Add Login Credentials for Wolfy

This plan creates a login account for Wolfy and maps it to the streamer profile.

---

## What Will Be Created

| Item | Details |
|------|---------|
| **Email** | `wolfy@hyperchat.site` |
| **Password** | Secure bcrypt-hashed password |
| **Streamer Mapping** | Links auth_users.id → streamers.user_id |

---

## Database Changes Required

### Step 1: Create Auth User for Wolfy

Insert a new user into `auth_users` table with:
- Email: `wolfy@hyperchat.site`
- Password: bcrypt-hashed (you'll need to provide the desired password)
- Role: `user` (matches other streamers)
- is_active: `true`

### Step 2: Link Streamer to User

Update the `streamers` table to set `user_id` to the newly created auth user's ID.

---

## SQL Migration

```sql
-- Step 1: Create auth user for Wolfy
-- Note: Password will be bcrypt hashed (the user should login and it will auto-upgrade)
-- Using a temporary password that should be changed
INSERT INTO auth_users (
  id,
  email,
  password_hash,
  username,
  role,
  is_active,
  failed_login_attempts
) VALUES (
  gen_random_uuid(),
  'wolfy@hyperchat.site',
  'TEMPORARY_PASSWORD_CHANGE_ME',  -- Will be auto-upgraded to bcrypt on first login
  'wolfy',
  'user',
  true,
  0
);

-- Step 2: Link Wolfy streamer to the new auth user
UPDATE streamers 
SET user_id = (SELECT id FROM auth_users WHERE email = 'wolfy@hyperchat.site')
WHERE streamer_slug = 'wolfy';
```

---

## Password Handling

The authenticate-user edge function automatically upgrades plaintext passwords to bcrypt on first login (lines 188-208 of the function). So we can:

1. Set a temporary plaintext password in the migration
2. On first login, it will be automatically hashed with bcrypt

---

## What You Need to Provide

Before I execute this migration, please provide:
- **Password for Wolfy's account** (will be securely hashed)

---

## After Implementation

Wolfy will be able to:
1. Login at `/auth` with `wolfy@hyperchat.site`
2. Access the Wolfy dashboard at `/dashboard/wolfy`
3. Manage settings, view donations, and moderate content

---

## Verification

After migration, the `get_user_streamers` function will return Wolfy's streamer when the user logs in, granting dashboard access.

