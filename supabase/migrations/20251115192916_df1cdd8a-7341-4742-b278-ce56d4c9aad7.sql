-- Create neko_xenpai_donations table
CREATE TABLE public.neko_xenpai_donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID REFERENCES public.streamers(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  tts_audio_url TEXT,
  order_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  audio_played_at TIMESTAMPTZ,
  mod_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  selected_gif_id TEXT
);

-- Enable RLS
ALTER TABLE public.neko_xenpai_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view approved donations
CREATE POLICY "Anyone can view approved donations"
ON public.neko_xenpai_donations
FOR SELECT
USING (
  moderation_status IN ('approved', 'auto_approved') 
  AND payment_status = 'success'
);

-- RLS Policy: Service role can manage all donations
CREATE POLICY "Service role can manage all donations"
ON public.neko_xenpai_donations
FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- Auto-approve hyperemotes trigger
CREATE OR REPLACE FUNCTION public.auto_approve_neko_xenpai_hyperemotes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER auto_approve_neko_xenpai_hyperemotes_trigger
BEFORE INSERT OR UPDATE ON public.neko_xenpai_donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_neko_xenpai_hyperemotes();

-- Insert streamer record
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, pusher_group, hyperemotes_enabled, hyperemotes_min_amount)
VALUES ('neko_xenpai', 'Neko XENPAI', '#d946ef', 1, true, 50)
ON CONFLICT (streamer_slug) DO NOTHING;