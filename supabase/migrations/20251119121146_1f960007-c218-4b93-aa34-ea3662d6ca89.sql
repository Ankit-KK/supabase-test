-- Create thunderx_donations table
CREATE TABLE public.thunderx_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  selected_gif_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.thunderx_donations ENABLE ROW LEVEL SECURITY;

-- Public can view approved donations
CREATE POLICY "Anyone can view approved donations" 
ON public.thunderx_donations 
FOR SELECT 
USING (
  (moderation_status = ANY (ARRAY['approved'::text, 'auto_approved'::text])) 
  AND (payment_status = 'success'::text)
);

-- Service role has full access
CREATE POLICY "Service role can manage all donations" 
ON public.thunderx_donations 
FOR ALL 
USING (is_service_role()) 
WITH CHECK (is_service_role());

-- Create auto-approve function for hyperemotes
CREATE OR REPLACE FUNCTION public.auto_approve_thunderx_hyperemotes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger
CREATE TRIGGER auto_approve_thunderx_hyperemotes_trigger
  BEFORE INSERT ON public.thunderx_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_thunderx_hyperemotes();

-- Insert THUNDERX streamer record
INSERT INTO public.streamers (
  streamer_slug,
  streamer_name,
  brand_color,
  hyperemotes_enabled,
  hyperemotes_min_amount,
  pusher_group
) VALUES (
  'thunderx',
  'THUNDERX',
  '#10b981',
  true,
  50,
  1
);

-- RLS policies for thunderx-gifs bucket
CREATE POLICY "Public can view thunderx GIFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'thunderx-gifs');

CREATE POLICY "Public can upload thunderx GIFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thunderx-gifs');

CREATE POLICY "Public can delete thunderx GIFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'thunderx-gifs');