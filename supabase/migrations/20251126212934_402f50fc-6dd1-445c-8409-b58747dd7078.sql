-- Create mriqmaster_donations table
CREATE TABLE IF NOT EXISTS public.mriqmaster_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  temp_voice_data TEXT,
  tts_audio_url TEXT,
  is_hyperemote BOOLEAN DEFAULT false,
  selected_gif_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  order_id TEXT,
  razorpay_order_id TEXT,
  streamer_id UUID REFERENCES public.streamers(id),
  message_visible BOOLEAN DEFAULT true,
  mod_notified BOOLEAN DEFAULT false,
  audio_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mriqmaster_donations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view approved donations"
  ON public.mriqmaster_donations
  FOR SELECT
  USING (
    moderation_status IN ('approved', 'auto_approved')
    AND payment_status = 'success'
  );

CREATE POLICY "Service role can manage all donations"
  ON public.mriqmaster_donations
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- Create auto-approve function
CREATE OR REPLACE FUNCTION public.auto_approve_mriqmaster_donations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger
DROP TRIGGER IF EXISTS auto_approve_mriqmaster_donations_trigger ON public.mriqmaster_donations;
CREATE TRIGGER auto_approve_mriqmaster_donations_trigger
  BEFORE INSERT OR UPDATE ON public.mriqmaster_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_mriqmaster_donations();

-- Insert streamer record
INSERT INTO public.streamers (
  streamer_slug,
  streamer_name,
  brand_color,
  pusher_group,
  hyperemotes_enabled,
  hyperemotes_min_amount
) VALUES (
  'mriqmaster',
  'Mr Iqmaster',
  '#06b6d4',
  1,
  true,
  50
)
ON CONFLICT (streamer_slug) DO NOTHING;

-- Create storage bucket for GIFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('mriqmaster-gifs', 'mriqmaster-gifs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for mriqmaster-gifs bucket
CREATE POLICY "Public can view mriqmaster GIFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mriqmaster-gifs');

CREATE POLICY "Service role can upload mriqmaster GIFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'mriqmaster-gifs' AND (current_setting('role') = 'service_role'));

CREATE POLICY "Service role can delete mriqmaster GIFs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'mriqmaster-gifs' AND (current_setting('role') = 'service_role'));