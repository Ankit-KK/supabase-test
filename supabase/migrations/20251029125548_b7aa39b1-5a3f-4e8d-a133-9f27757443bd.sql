-- Insert authentication records for 5 new streamers
INSERT INTO public.auth_users (id, email, password_hash, role, username, is_active)
VALUES
  -- ValorantPro
  (
    'aa000000-0000-0000-0000-000000000001'::uuid,
    'valorantpro@hyperchat.com',
    crypt('TempPass2025!', gen_salt('bf')),
    'user',
    'valorantpro',
    true
  ),
  -- CraftMaster
  (
    'bb000000-0000-0000-0000-000000000002'::uuid,
    'craftmaster@hyperchat.com',
    crypt('TempPass2025!', gen_salt('bf')),
    'user',
    'craftmaster',
    true
  ),
  -- ApexLegend
  (
    'cc000000-0000-0000-0000-000000000003'::uuid,
    'apexlegend@hyperchat.com',
    crypt('TempPass2025!', gen_salt('bf')),
    'user',
    'apexlegend',
    true
  ),
  -- LofiBeats
  (
    'dd000000-0000-0000-0000-000000000004'::uuid,
    'lofibeats@hyperchat.com',
    crypt('TempPass2025!', gen_salt('bf')),
    'user',
    'lofibeats',
    true
  ),
  -- YogaTime
  (
    'ee000000-0000-0000-0000-000000000005'::uuid,
    'yogatime@hyperchat.com',
    crypt('TempPass2025!', gen_salt('bf')),
    'user',
    'yogatime',
    true
  )
ON CONFLICT (email) DO NOTHING;

-- Link ValorantPro streamer to auth user
UPDATE public.streamers 
SET user_id = 'aa000000-0000-0000-0000-000000000001'::uuid,
    updated_at = now()
WHERE streamer_slug = 'valorantpro';

-- Link CraftMaster streamer to auth user
UPDATE public.streamers 
SET user_id = 'bb000000-0000-0000-0000-000000000002'::uuid,
    updated_at = now()
WHERE streamer_slug = 'craftmaster';

-- Link ApexLegend streamer to auth user
UPDATE public.streamers 
SET user_id = 'cc000000-0000-0000-0000-000000000003'::uuid,
    updated_at = now()
WHERE streamer_slug = 'apexlegend';

-- Link LofiBeats streamer to auth user
UPDATE public.streamers 
SET user_id = 'dd000000-0000-0000-0000-000000000004'::uuid,
    updated_at = now()
WHERE streamer_slug = 'lofibeats';

-- Link YogaTime streamer to auth user
UPDATE public.streamers 
SET user_id = 'ee000000-0000-0000-0000-000000000005'::uuid,
    updated_at = now()
WHERE streamer_slug = 'yogatime';