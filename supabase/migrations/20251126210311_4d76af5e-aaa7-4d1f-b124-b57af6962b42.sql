-- Create bongflick_donations table
CREATE TABLE public.bongflick_donations (
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
  approved_at TIMESTAMPTZ,
  is_hyperemote BOOLEAN DEFAULT false,
  selected_gif_id TEXT,
  message_visible BOOLEAN DEFAULT true,
  audio_played_at TIMESTAMPTZ,
  mod_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bongflick_donations ENABLE ROW LEVEL SECURITY;

-- Public read for approved donations
CREATE POLICY "Anyone can view approved donations" ON public.bongflick_donations
  FOR SELECT USING (
    payment_status = 'success' 
    AND moderation_status IN ('approved', 'auto_approved')
  );

-- Service role full access
CREATE POLICY "Service role can manage all donations" ON public.bongflick_donations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-approve function
CREATE OR REPLACE FUNCTION public.auto_approve_bongflick_donations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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
CREATE TRIGGER trigger_auto_approve_bongflick
  BEFORE INSERT OR UPDATE ON public.bongflick_donations
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_bongflick_donations();

-- Insert streamer record
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, pusher_group, hyperemotes_enabled, hyperemotes_min_amount)
VALUES ('bongflick', 'BongFlick', '#8b5cf6', 1, true, 50);