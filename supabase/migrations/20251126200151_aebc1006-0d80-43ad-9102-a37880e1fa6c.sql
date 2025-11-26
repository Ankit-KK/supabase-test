-- Create notyourkween_donations table
CREATE TABLE IF NOT EXISTS public.notyourkween_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES public.streamers(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
  order_id TEXT,
  razorpay_order_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_hyperemote BOOLEAN DEFAULT false,
  selected_gif_id TEXT,
  message_visible BOOLEAN DEFAULT true,
  audio_played_at TIMESTAMP WITH TIME ZONE,
  mod_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notyourkween_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view approved donations
CREATE POLICY "Anyone can view approved donations"
  ON public.notyourkween_donations
  FOR SELECT
  USING (
    moderation_status IN ('approved', 'auto_approved') 
    AND payment_status = 'success'
  );

-- RLS Policy: Service role can manage all donations
CREATE POLICY "Service role can manage all donations"
  ON public.notyourkween_donations
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- Insert streamer record
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, pusher_group, hyperemotes_enabled, hyperemotes_min_amount)
VALUES ('notyourkween', 'not your Kween', '#ec4899', 1, true, 50)
ON CONFLICT (streamer_slug) DO NOTHING;

-- Create auto-approve function
CREATE OR REPLACE FUNCTION public.auto_approve_notyourkween_donations()
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
DROP TRIGGER IF EXISTS auto_approve_notyourkween_donations_trigger ON public.notyourkween_donations;
CREATE TRIGGER auto_approve_notyourkween_donations_trigger
  BEFORE INSERT OR UPDATE ON public.notyourkween_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_notyourkween_donations();

-- Create storage bucket for hyperemote GIFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('notyourkween-gifs', 'notyourkween-gifs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Public can view notyourkween gifs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notyourkween-gifs');

CREATE POLICY "Authenticated users can upload notyourkween gifs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'notyourkween-gifs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete notyourkween gifs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'notyourkween-gifs' AND auth.role() = 'authenticated');