
-- Create dorp_plays_donations table (matching wolfy_donations schema exactly)
CREATE TABLE public.dorp_plays_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid REFERENCES public.streamers(id),
  name text NOT NULL,
  amount numeric NOT NULL,
  currency varchar DEFAULT 'INR',
  message text,
  voice_message_url text,
  temp_voice_data text,
  tts_audio_url text,
  hypersound_url text,
  is_hyperemote boolean DEFAULT false,
  media_url text,
  media_type text,
  order_id text,
  razorpay_order_id text,
  payment_status text DEFAULT 'pending',
  moderation_status text DEFAULT 'pending',
  approved_by text,
  approved_at timestamptz,
  mod_notified boolean DEFAULT false,
  message_visible boolean DEFAULT true,
  audio_scheduled_at timestamptz,
  audio_played_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dorp_plays_donations ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view approved donations
CREATE POLICY "Anyone can view approved dorp plays donations"
ON public.dorp_plays_donations
FOR SELECT
USING ((moderation_status = ANY (ARRAY['approved'::text, 'auto_approved'::text])) AND (payment_status = 'success'::text));

-- RLS: Service role can manage all donations
CREATE POLICY "Service role can manage dorp plays donations"
ON public.dorp_plays_donations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant SELECT to anon and authenticated (needed for RLS policies to work)
GRANT SELECT ON public.dorp_plays_donations TO anon;
GRANT SELECT ON public.dorp_plays_donations TO authenticated;

-- Create public view (matching other streamers)
CREATE VIEW public.dorp_plays_donations_public AS
SELECT id, name, amount, currency, message, message_visible, voice_message_url, tts_audio_url, hypersound_url, is_hyperemote, created_at
FROM public.dorp_plays_donations
WHERE payment_status = 'success' AND moderation_status IN ('approved', 'auto_approved');

-- Insert streamer record
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, tts_enabled, moderation_mode, media_upload_enabled, telegram_moderation_enabled, leaderboard_widget_enabled)
VALUES ('dorp_plays', 'DorpPlays', '#6366f1', true, 'auto_approve', false, true, true);
