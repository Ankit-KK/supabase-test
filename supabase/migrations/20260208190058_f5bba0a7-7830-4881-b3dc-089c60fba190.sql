CREATE OR REPLACE VIEW public.clumsy_god_donations_public
WITH (security_invoker = on) AS
SELECT
  id, name, amount, currency, message, message_visible,
  is_hyperemote, voice_message_url, hypersound_url,
  tts_audio_url, created_at
FROM clumsy_god_donations
WHERE moderation_status IN ('approved', 'auto_approved')
  AND payment_status = 'success';