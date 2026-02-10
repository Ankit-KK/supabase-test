UPDATE public.streamers
SET message_char_tiers = '[{"min_amount":0,"max_chars":100},{"min_amount":100,"max_chars":200},{"min_amount":200,"max_chars":250}]'::jsonb
WHERE streamer_slug = 'ankit';