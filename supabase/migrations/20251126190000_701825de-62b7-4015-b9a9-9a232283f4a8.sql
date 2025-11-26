-- Create sagarujjwalgaming_donations table
CREATE TABLE IF NOT EXISTS public.sagarujjwalgaming_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES public.streamers(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  tts_audio_url TEXT,
  order_id TEXT,
  razorpay_order_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  audio_played_at TIMESTAMP WITH TIME ZONE,
  mod_notified BOOLEAN DEFAULT false,
  selected_gif_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sagarujjwalgaming_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view approved donations
CREATE POLICY "Anyone can view approved donations"
ON public.sagarujjwalgaming_donations
FOR SELECT
USING (
  moderation_status IN ('approved', 'auto_approved') 
  AND payment_status = 'success'
);

-- RLS Policy: Service role can manage all donations
CREATE POLICY "Service role can manage all donations"
ON public.sagarujjwalgaming_donations
FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- Create auto-approve function
CREATE OR REPLACE FUNCTION public.auto_approve_sagarujjwalgaming_donations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-approve ALL donations on both INSERT and UPDATE
  IF TG_OP = 'INSERT' THEN
    IF NEW.moderation_status IS NULL OR NEW.moderation_status = 'pending' THEN
      NEW.moderation_status := 'auto_approved';
      NEW.approved_by := 'system';
      NEW.approved_at := now();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.moderation_status, 'pending') = 'pending' THEN
      NEW.moderation_status := 'auto_approved';
      NEW.approved_by := 'system';
      NEW.approved_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-approval
CREATE TRIGGER auto_approve_sagarujjwalgaming_donations_trigger
BEFORE INSERT OR UPDATE ON public.sagarujjwalgaming_donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_sagarujjwalgaming_donations();

-- Insert streamer record
INSERT INTO public.streamers (
  streamer_slug,
  streamer_name,
  brand_color,
  pusher_group,
  hyperemotes_enabled,
  hyperemotes_min_amount
) VALUES (
  'sagarujjwalgaming',
  'SAGAR UJJWAL GAMING',
  '#ef4444',
  1,
  true,
  50
);

-- Create storage bucket for GIFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('sagarujjwalgaming-gifs', 'sagarujjwalgaming-gifs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for GIFs
CREATE POLICY "Public can view GIFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'sagarujjwalgaming-gifs');

CREATE POLICY "Public can upload GIFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sagarujjwalgaming-gifs');

CREATE POLICY "Public can delete GIFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'sagarujjwalgaming-gifs');