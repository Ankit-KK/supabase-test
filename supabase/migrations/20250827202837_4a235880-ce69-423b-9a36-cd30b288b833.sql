-- Create chia_gaming streamer record
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, username, password, hyperemotes_enabled, hyperemotes_min_amount)
VALUES (
  'chia_gaming',
  'Chia Gaming',
  '#ff69b4',
  'chia_gaming',
  'password123',
  true,
  50
) ON CONFLICT (streamer_slug) DO NOTHING;