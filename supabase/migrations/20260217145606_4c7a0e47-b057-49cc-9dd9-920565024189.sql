
-- Fix zishu_donations_public view to use security_invoker
CREATE OR REPLACE VIEW public.zishu_donations_public
WITH (security_invoker = on) AS
  SELECT id, name, amount, currency, message, message_visible, is_hyperemote, 
         tts_audio_url, voice_message_url, hypersound_url, created_at
  FROM public.zishu_donations
  WHERE payment_status = 'success' 
    AND moderation_status IN ('approved', 'auto_approved');
