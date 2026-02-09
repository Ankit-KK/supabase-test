UPDATE public.streamers
SET message_char_tiers = '[{"min_amount":0,"max_chars":70},{"min_amount":100,"max_chars":150},{"min_amount":300,"max_chars":200}]'::jsonb
WHERE streamer_slug = 'clumsy_god';