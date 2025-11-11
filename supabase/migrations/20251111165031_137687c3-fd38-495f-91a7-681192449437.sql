-- Create looteriya_gaming_donations table with same schema as codelive_donations
CREATE TABLE IF NOT EXISTS public.looteriya_gaming_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID REFERENCES public.streamers(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  tts_audio_url TEXT,
  order_id TEXT UNIQUE,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  audio_played_at TIMESTAMP WITH TIME ZONE,
  mod_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.looteriya_gaming_donations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public viewing of approved donations
CREATE POLICY "Anyone can view approved donations"
ON public.looteriya_gaming_donations
FOR SELECT
USING (
  moderation_status IN ('approved', 'auto_approved') 
  AND payment_status = 'success'
);

-- Create policy for service role to manage all donations
CREATE POLICY "Service role can manage all donations"
ON public.looteriya_gaming_donations
FOR ALL
USING (public.is_service_role())
WITH CHECK (public.is_service_role());

-- Create trigger for auto-approving hyperemotes
CREATE OR REPLACE FUNCTION public.auto_approve_looteriya_gaming_hyperemotes()
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

CREATE TRIGGER auto_approve_looteriya_gaming_hyperemotes_trigger
BEFORE INSERT ON public.looteriya_gaming_donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_looteriya_gaming_hyperemotes();

-- Insert or update streamer entry for Looteriya Gaming
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, hyperemotes_enabled, hyperemotes_min_amount)
VALUES ('looteriya_gaming', 'Looteriya Gaming', '#f59e0b', true, 50)
ON CONFLICT (streamer_slug) 
DO UPDATE SET 
  streamer_name = 'Looteriya Gaming',
  brand_color = '#f59e0b',
  hyperemotes_enabled = true,
  hyperemotes_min_amount = 50,
  updated_at = now();