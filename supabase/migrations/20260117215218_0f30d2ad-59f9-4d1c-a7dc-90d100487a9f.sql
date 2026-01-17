-- Fix: Create secure public views for donation tables that exclude sensitive payment identifiers
-- This prevents exposure of razorpay_order_id, order_id, temp_voice_data, and internal tracking fields

-- Create secure view for abdevil_donations
CREATE OR REPLACE VIEW abdevil_donations_public AS
SELECT id, name, amount, currency, message, message_visible, 
       voice_message_url, tts_audio_url, hypersound_url, 
       selected_gif_id, is_hyperemote, created_at
FROM abdevil_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for ankit_donations
CREATE OR REPLACE VIEW ankit_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       is_hyperemote, created_at
FROM ankit_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for bongflick_donations
CREATE OR REPLACE VIEW bongflick_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM bongflick_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for chiaa_gaming_donations
CREATE OR REPLACE VIEW chiaa_gaming_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       is_hyperemote, created_at
FROM chiaa_gaming_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for clumsygod_donations
CREATE OR REPLACE VIEW clumsygod_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM clumsygod_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for damask_plays_donations
CREATE OR REPLACE VIEW damask_plays_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM damask_plays_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for jhanvoo_donations
CREATE OR REPLACE VIEW jhanvoo_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM jhanvoo_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for jimmy_gaming_donations
CREATE OR REPLACE VIEW jimmy_gaming_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM jimmy_gaming_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for looteriya_gaming_donations
CREATE OR REPLACE VIEW looteriya_gaming_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM looteriya_gaming_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for mriqmaster_donations
CREATE OR REPLACE VIEW mriqmaster_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM mriqmaster_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for neko_xenpai_donations
CREATE OR REPLACE VIEW neko_xenpai_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM neko_xenpai_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for notyourkween_donations
CREATE OR REPLACE VIEW notyourkween_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM notyourkween_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for sagarujjwalgaming_donations
CREATE OR REPLACE VIEW sagarujjwalgaming_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM sagarujjwalgaming_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for sizzors_donations
CREATE OR REPLACE VIEW sizzors_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       is_hyperemote, created_at
FROM sizzors_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for thunderx_donations
CREATE OR REPLACE VIEW thunderx_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM thunderx_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Create secure view for vipbhai_donations
CREATE OR REPLACE VIEW vipbhai_donations_public AS
SELECT id, name, amount, currency, message, message_visible,
       voice_message_url, tts_audio_url, hypersound_url,
       selected_gif_id, is_hyperemote, created_at
FROM vipbhai_donations
WHERE moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success';

-- Grant SELECT on public views to anon and authenticated
GRANT SELECT ON abdevil_donations_public TO anon, authenticated;
GRANT SELECT ON ankit_donations_public TO anon, authenticated;
GRANT SELECT ON bongflick_donations_public TO anon, authenticated;
GRANT SELECT ON chiaa_gaming_donations_public TO anon, authenticated;
GRANT SELECT ON clumsygod_donations_public TO anon, authenticated;
GRANT SELECT ON damask_plays_donations_public TO anon, authenticated;
GRANT SELECT ON jhanvoo_donations_public TO anon, authenticated;
GRANT SELECT ON jimmy_gaming_donations_public TO anon, authenticated;
GRANT SELECT ON looteriya_gaming_donations_public TO anon, authenticated;
GRANT SELECT ON mriqmaster_donations_public TO anon, authenticated;
GRANT SELECT ON neko_xenpai_donations_public TO anon, authenticated;
GRANT SELECT ON notyourkween_donations_public TO anon, authenticated;
GRANT SELECT ON sagarujjwalgaming_donations_public TO anon, authenticated;
GRANT SELECT ON sizzors_donations_public TO anon, authenticated;
GRANT SELECT ON thunderx_donations_public TO anon, authenticated;
GRANT SELECT ON vipbhai_donations_public TO anon, authenticated;

-- Revoke direct SELECT on base tables from anon (keep authenticated for dashboard access)
-- Note: Service role still has full access for backend operations
REVOKE SELECT ON abdevil_donations FROM anon;
REVOKE SELECT ON ankit_donations FROM anon;
REVOKE SELECT ON bongflick_donations FROM anon;
REVOKE SELECT ON chiaa_gaming_donations FROM anon;
REVOKE SELECT ON clumsygod_donations FROM anon;
REVOKE SELECT ON damask_plays_donations FROM anon;
REVOKE SELECT ON jhanvoo_donations FROM anon;
REVOKE SELECT ON jimmy_gaming_donations FROM anon;
REVOKE SELECT ON looteriya_gaming_donations FROM anon;
REVOKE SELECT ON mriqmaster_donations FROM anon;
REVOKE SELECT ON neko_xenpai_donations FROM anon;
REVOKE SELECT ON notyourkween_donations FROM anon;
REVOKE SELECT ON sagarujjwalgaming_donations FROM anon;
REVOKE SELECT ON sizzors_donations FROM anon;
REVOKE SELECT ON thunderx_donations FROM anon;
REVOKE SELECT ON vipbhai_donations FROM anon;