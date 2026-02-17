
-- Create zishu_donations table
CREATE TABLE IF NOT EXISTS public.zishu_donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  amount numeric NOT NULL,
  currency character varying DEFAULT 'INR'::character varying,
  message text,
  voice_message_url text,
  tts_audio_url text,
  temp_voice_data text,
  hypersound_url text,
  is_hyperemote boolean DEFAULT false,
  media_type text,
  media_url text,
  order_id text,
  razorpay_order_id text,
  payment_status text DEFAULT 'pending'::text,
  moderation_status text DEFAULT 'pending'::text,
  approved_by text,
  approved_at timestamp with time zone,
  message_visible boolean DEFAULT true,
  mod_notified boolean DEFAULT false,
  audio_played_at timestamp with time zone,
  audio_scheduled_at timestamp with time zone,
  streamer_id uuid REFERENCES public.streamers(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zishu_donations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view approved zishu donations"
  ON public.zishu_donations FOR SELECT
  USING (moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success');

CREATE POLICY "Service role can manage zishu donations"
  ON public.zishu_donations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant access to anon and authenticated roles
GRANT SELECT ON public.zishu_donations TO anon, authenticated;

-- Create public view
CREATE OR REPLACE VIEW public.zishu_donations_public AS
  SELECT id, name, amount, currency, message, message_visible, is_hyperemote, 
         tts_audio_url, voice_message_url, hypersound_url, created_at
  FROM public.zishu_donations
  WHERE payment_status = 'success' 
    AND moderation_status IN ('approved', 'auto_approved');
