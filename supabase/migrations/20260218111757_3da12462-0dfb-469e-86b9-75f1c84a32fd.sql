
-- Create brigzard_donations table (matching zishu_donations schema exactly)
CREATE TABLE public.brigzard_donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  amount numeric NOT NULL,
  currency character varying DEFAULT 'INR'::character varying,
  message text,
  voice_message_url text,
  temp_voice_data text,
  tts_audio_url text,
  hypersound_url text,
  media_url text,
  media_type text,
  order_id text,
  razorpay_order_id text,
  payment_status text DEFAULT 'pending'::text,
  moderation_status text DEFAULT 'pending'::text,
  approved_by text,
  approved_at timestamp with time zone,
  is_hyperemote boolean DEFAULT false,
  streamer_id uuid REFERENCES public.streamers(id),
  message_visible boolean DEFAULT true,
  mod_notified boolean DEFAULT false,
  audio_played_at timestamp with time zone,
  audio_scheduled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brigzard_donations ENABLE ROW LEVEL SECURITY;

-- RESTRICTIVE SELECT: only approved + success donations visible to public
CREATE POLICY "Anyone can view approved brigzard donations"
  ON public.brigzard_donations
  AS RESTRICTIVE
  FOR SELECT
  USING (
    moderation_status = ANY (ARRAY['approved'::text, 'auto_approved'::text])
    AND payment_status = 'success'::text
  );

-- Service role can manage all donations
CREATE POLICY "Service role can manage brigzard donations"
  ON public.brigzard_donations
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant SELECT to anon and authenticated
GRANT SELECT ON public.brigzard_donations TO anon, authenticated;

-- Create public view with security_invoker
CREATE VIEW public.brigzard_donations_public
  WITH (security_invoker = on)
  AS SELECT
    id, name, amount, currency, message, voice_message_url,
    tts_audio_url, hypersound_url, is_hyperemote, message_visible, created_at
  FROM public.brigzard_donations
  WHERE moderation_status IN ('approved', 'auto_approved')
    AND payment_status = 'success';

-- Insert streamer record
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, moderation_mode, min_text_amount_inr)
VALUES ('brigzard', 'BRIGZARD', '#4a5c3e', 'auto_approve', 40);
