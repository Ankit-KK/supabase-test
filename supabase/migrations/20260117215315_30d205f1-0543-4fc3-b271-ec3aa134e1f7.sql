-- Fix: Set security_invoker = on for all donation public views
-- This ensures RLS policies of the querying user are enforced, not the view creator

-- Recreate views with security_invoker = on
CREATE OR REPLACE VIEW abdevil_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible, 
       voice_message_url, tts_audio_url, hypersound_url, 
       selected_gif_id, is_hyperemote, created_at
FROM abdevil_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW ankit_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       is_hyperemote, created_at
FROM ankit_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW bongflick_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM bongflick_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW chiaa_gaming_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       is_hyperemote, created_at
FROM chiaa_gaming_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW clumsygod_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM clumsygod_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW damask_plays_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM damask_plays_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW jhanvoo_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM jhanvoo_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW jimmy_gaming_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM jimmy_gaming_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW looteriya_gaming_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM looteriya_gaming_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW mriqmaster_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM mriqmaster_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW neko_xenpai_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM neko_xenpai_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW notyourkween_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM notyourkween_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW sagarujjwalgaming_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM sagarujjwalgaming_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW sizzors_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       is_hyperemote, created_at
FROM sizzors_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW thunderx_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM thunderx_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

CREATE OR REPLACE VIEW vipbhai_donations_public 
WITH (security_invoker = on) AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM vipbhai_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';