-- Create clumsy_god_donations table
CREATE TABLE IF NOT EXISTS public.clumsy_god_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES public.streamers(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'INR',
  message TEXT,
  voice_message_url TEXT,
  hypersound_url TEXT,
  media_url TEXT,
  media_type TEXT,
  is_hyperemote BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  order_id TEXT,
  razorpay_order_id TEXT,
  temp_voice_data TEXT,
  tts_audio_url TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  message_visible BOOLEAN DEFAULT true,
  mod_notified BOOLEAN DEFAULT false,
  audio_scheduled_at TIMESTAMPTZ,
  audio_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clumsy_god_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can create clumsy god donations" ON public.clumsy_god_donations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view approved clumsy god donations" ON public.clumsy_god_donations
  FOR SELECT USING (
    moderation_status IN ('approved', 'auto_approved') 
    AND payment_status = 'success'
  );

-- Create public view for leaderboard
CREATE OR REPLACE VIEW public.clumsy_god_donations_public AS
SELECT 
  id, name, amount, currency, message, message_visible,
  is_hyperemote, voice_message_url, hypersound_url, tts_audio_url, created_at
FROM public.clumsy_god_donations
WHERE moderation_status IN ('approved', 'auto_approved')
  AND payment_status = 'success';

-- Insert streamer record
INSERT INTO public.streamers (
  streamer_slug,
  streamer_name,
  brand_color,
  moderation_mode,
  tts_enabled,
  telegram_moderation_enabled,
  hyperemotes_enabled,
  media_upload_enabled,
  media_moderation_enabled,
  pusher_group,
  goal_is_active,
  tts_voice_id
) VALUES (
  'clumsy_god',
  'Clumsy God',
  '#10b981',
  'auto_approve',
  true,
  true,
  true,
  true,
  true,
  1,
  false,
  'moss_audio_3e9334b7-e32a-11f0-ba34-ee3bcee0a7c9'
);