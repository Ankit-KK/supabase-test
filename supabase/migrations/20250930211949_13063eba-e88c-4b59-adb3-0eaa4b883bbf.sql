-- Update hyperemote settings for all streamers (except Ankit which stays at 1)
UPDATE public.streamers 
SET 
  hyperemotes_enabled = true,
  hyperemotes_min_amount = 50
WHERE streamer_slug IN ('chia_gaming', 'techgamer', 'demostreamer', 'fitnessflow', 'musicstream', 'codelive', 'artcreate');

-- Ensure Ankit keeps its current settings (hyperemotes_min_amount = 1)
UPDATE public.streamers 
SET 
  hyperemotes_enabled = true,
  hyperemotes_min_amount = 1
WHERE streamer_slug = 'ankit';