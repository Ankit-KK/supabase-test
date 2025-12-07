-- Create clumsygod_donations table
CREATE TABLE public.clumsygod_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT,
  razorpay_order_id TEXT,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  audio_played_at TIMESTAMP WITH TIME ZONE,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  mod_notified BOOLEAN DEFAULT false,
  selected_gif_id TEXT,
  streamer_id UUID REFERENCES public.streamers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clumsygod_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view approved donations" ON public.clumsygod_donations
  FOR SELECT USING (
    moderation_status IN ('approved', 'auto_approved') AND payment_status = 'success'
  );

CREATE POLICY "Service role can manage all donations" ON public.clumsygod_donations
  FOR ALL USING (is_service_role()) WITH CHECK (is_service_role());

-- Auto-approval function
CREATE OR REPLACE FUNCTION public.auto_approve_clumsygod_donations()
RETURNS TRIGGER
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

-- Trigger for auto-approval
CREATE TRIGGER auto_approve_clumsygod_donations_trigger
  BEFORE INSERT OR UPDATE ON public.clumsygod_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_clumsygod_donations();

-- Insert streamer record
INSERT INTO public.streamers (streamer_name, streamer_slug, brand_color, pusher_group, hyperemotes_enabled, hyperemotes_min_amount)
VALUES ('ClumsyGod', 'clumsygod', '#ef4444', 1, true, 50);