
-- =====================================================
-- W Era Donations Table
-- =====================================================
CREATE TABLE public.w_era_donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  amount numeric NOT NULL,
  currency character varying DEFAULT 'INR'::character varying,
  message text,
  payment_status text DEFAULT 'pending'::text,
  moderation_status text DEFAULT 'pending'::text,
  order_id text,
  razorpay_order_id text,
  streamer_id uuid REFERENCES public.streamers(id),
  tts_audio_url text,
  voice_message_url text,
  temp_voice_data text,
  hypersound_url text,
  is_hyperemote boolean DEFAULT false,
  media_url text,
  media_type text,
  message_visible boolean DEFAULT true,
  mod_notified boolean DEFAULT false,
  approved_by text,
  approved_at timestamp with time zone,
  audio_played_at timestamp with time zone,
  audio_scheduled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.w_era_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved w_era donations"
  ON public.w_era_donations FOR SELECT
  USING ((moderation_status = ANY (ARRAY['approved'::text, 'auto_approved'::text])) AND (payment_status = 'success'::text));

CREATE POLICY "Service role can manage w_era donations"
  ON public.w_era_donations FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Mr Champion Donations Table
-- =====================================================
CREATE TABLE public.mr_champion_donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  amount numeric NOT NULL,
  currency character varying DEFAULT 'INR'::character varying,
  message text,
  payment_status text DEFAULT 'pending'::text,
  moderation_status text DEFAULT 'pending'::text,
  order_id text,
  razorpay_order_id text,
  streamer_id uuid REFERENCES public.streamers(id),
  tts_audio_url text,
  voice_message_url text,
  temp_voice_data text,
  hypersound_url text,
  is_hyperemote boolean DEFAULT false,
  media_url text,
  media_type text,
  message_visible boolean DEFAULT true,
  mod_notified boolean DEFAULT false,
  approved_by text,
  approved_at timestamp with time zone,
  audio_played_at timestamp with time zone,
  audio_scheduled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.mr_champion_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved mr_champion donations"
  ON public.mr_champion_donations FOR SELECT
  USING ((moderation_status = ANY (ARRAY['approved'::text, 'auto_approved'::text])) AND (payment_status = 'success'::text));

CREATE POLICY "Service role can manage mr_champion donations"
  ON public.mr_champion_donations FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Insert streamer rows
-- =====================================================
INSERT INTO public.streamers (streamer_name, streamer_slug, brand_color)
VALUES
  ('W Era', 'w_era', '#3b82f6'),
  ('Mr Champion', 'mr_champion', '#eab308');
