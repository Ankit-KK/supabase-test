-- Create jhanvoo_donations table
CREATE TABLE public.jhanvoo_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  tts_audio_url TEXT,
  is_hyperemote BOOLEAN DEFAULT false,
  selected_gif_id TEXT,
  order_id TEXT,
  razorpay_order_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  message_visible BOOLEAN DEFAULT true,
  mod_notified BOOLEAN DEFAULT false,
  audio_played_at TIMESTAMPTZ,
  streamer_id UUID REFERENCES public.streamers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jhanvoo_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view approved donations
CREATE POLICY "Anyone can view approved donations"
ON public.jhanvoo_donations
FOR SELECT
USING (
  moderation_status IN ('approved', 'auto_approved')
  AND payment_status = 'success'
);

-- RLS Policy: Service role can manage all donations
CREATE POLICY "Service role can manage all donations"
ON public.jhanvoo_donations
FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- Auto-approval function
CREATE OR REPLACE FUNCTION public.auto_approve_jhanvoo_donations()
RETURNS TRIGGER AS $$
BEGIN
  NEW.moderation_status := 'auto_approved';
  NEW.approved_by := 'system';
  NEW.approved_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto-approval trigger
CREATE TRIGGER auto_approve_jhanvoo_donations_trigger
BEFORE INSERT ON public.jhanvoo_donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_jhanvoo_donations();

-- Insert Jhanvoo streamer record
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, pusher_group, hyperemotes_enabled, hyperemotes_min_amount)
VALUES ('jhanvoo', 'Jhanvoo', '#6366f1', 1, true, 50);

-- Create storage bucket for jhanvoo-gifs
INSERT INTO storage.buckets (id, name, public)
VALUES ('jhanvoo-gifs', 'jhanvoo-gifs', true);

-- Storage RLS policies
CREATE POLICY "Anyone can view jhanvoo gifs"
ON storage.objects FOR SELECT
USING (bucket_id = 'jhanvoo-gifs');

CREATE POLICY "Service role can upload jhanvoo gifs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'jhanvoo-gifs' AND is_service_role());

CREATE POLICY "Service role can delete jhanvoo gifs"
ON storage.objects FOR DELETE
USING (bucket_id = 'jhanvoo-gifs' AND is_service_role());