-- Create jimmy_gaming_donations table
CREATE TABLE public.jimmy_gaming_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID REFERENCES public.streamers(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'INR',
  message TEXT,
  voice_message_url TEXT,
  hypersound_url TEXT,
  tts_audio_url TEXT,
  temp_voice_data TEXT,
  order_id TEXT,
  razorpay_order_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  mod_notified BOOLEAN DEFAULT false,
  audio_played_at TIMESTAMPTZ,
  audio_scheduled_at TIMESTAMPTZ,
  selected_gif_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jimmy_gaming_donations ENABLE ROW LEVEL SECURITY;

-- Public read for approved donations
CREATE POLICY "Anyone can view approved donations" ON public.jimmy_gaming_donations
FOR SELECT USING (
  moderation_status IN ('approved', 'auto_approved') 
  AND payment_status = 'success'
);

-- Service role full access
CREATE POLICY "Service role can manage all donations" ON public.jimmy_gaming_donations
FOR ALL USING (is_service_role()) WITH CHECK (is_service_role());

-- Create auto-approve function
CREATE OR REPLACE FUNCTION public.auto_approve_jimmy_gaming_donations()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER auto_approve_jimmy_gaming_trigger
BEFORE INSERT OR UPDATE ON public.jimmy_gaming_donations
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_jimmy_gaming_donations();

-- Insert streamer record
INSERT INTO public.streamers (
  streamer_slug, 
  streamer_name, 
  brand_color,
  hyperemotes_enabled,
  hyperemotes_min_amount,
  pusher_group
) VALUES (
  'jimmy_gaming',
  'Jimmy Gaming',
  '#22c55e',
  true,
  30,
  1
);