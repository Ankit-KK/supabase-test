
-- Create demigod_donations table (matching mr_champion_donations schema exactly)
CREATE TABLE public.demigod_donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  amount numeric NOT NULL,
  amount_inr numeric,
  currency character varying DEFAULT 'INR'::character varying,
  message text,
  voice_message_url text,
  tts_audio_url text,
  hypersound_url text,
  is_hyperemote boolean DEFAULT false,
  media_url text,
  media_type text,
  order_id text,
  razorpay_order_id text,
  payment_status text DEFAULT 'pending'::text,
  moderation_status text DEFAULT 'pending'::text,
  approved_at timestamp with time zone,
  approved_by text,
  message_visible boolean DEFAULT true,
  mod_notified boolean DEFAULT false,
  audio_played_at timestamp with time zone,
  audio_scheduled_at timestamp with time zone,
  temp_voice_data text,
  streamer_id uuid REFERENCES public.streamers(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demigod_donations ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view approved donations (PERMISSIVE per platform standard)
CREATE POLICY "Anyone can view approved demigod donations"
  ON public.demigod_donations FOR SELECT
  USING (moderation_status IN ('approved','auto_approved') AND payment_status = 'success');

-- RLS: Service role full access (scoped TO service_role)
CREATE POLICY "Service role can manage demigod donations"
  ON public.demigod_donations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Public view with security_invoker
CREATE VIEW public.demigod_donations_public WITH (security_invoker = on) AS
  SELECT id, name, amount, currency, message, message_visible, voice_message_url,
         tts_audio_url, hypersound_url, is_hyperemote, created_at
  FROM public.demigod_donations
  WHERE moderation_status IN ('approved','auto_approved') AND payment_status = 'success';

-- Insert streamer record
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, moderation_mode, tts_enabled, telegram_moderation_enabled, leaderboard_widget_enabled, media_upload_enabled, media_moderation_enabled, hyperemotes_enabled)
VALUES ('demigod', 'Demigod', '#8b5cf6', 'auto_approve', true, true, true, false, true, true);
