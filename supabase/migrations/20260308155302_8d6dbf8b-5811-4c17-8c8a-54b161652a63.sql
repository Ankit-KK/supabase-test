
-- Insert auth account for Demigod (plaintext password auto-upgrades to bcrypt on first login)
INSERT INTO public.auth_users (email, password_hash, streamer_id, role)
VALUES ('demigod@hyperchat.site', 'demigodtemp123', '14bdfeae-45e9-44be-9c4a-c0dd8ded722c', 'user');
