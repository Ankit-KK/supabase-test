-- Create abdevil_donations table
CREATE TABLE IF NOT EXISTS public.abdevil_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  message_visible BOOLEAN DEFAULT true,
  mod_notified BOOLEAN DEFAULT false,
  audio_played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  streamer_id UUID REFERENCES public.streamers(id),
  selected_gif_id TEXT
);

-- Enable RLS
ALTER TABLE public.abdevil_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view approved donations
CREATE POLICY "Anyone can view approved donations"
ON public.abdevil_donations
FOR SELECT
USING (
  moderation_status IN ('approved', 'auto_approved')
  AND payment_status = 'success'
);

-- RLS Policy: Service role can manage all donations
CREATE POLICY "Service role can manage all donations"
ON public.abdevil_donations
FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- Create auto-approve function for ABdevil donations
CREATE OR REPLACE FUNCTION public.auto_approve_abdevil_donations()
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
CREATE TRIGGER auto_approve_abdevil_donations_trigger
BEFORE INSERT OR UPDATE ON public.abdevil_donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_abdevil_donations();

-- Insert ABdevil streamer record
INSERT INTO public.streamers (
  streamer_slug,
  streamer_name,
  brand_color,
  hyperemotes_enabled,
  hyperemotes_min_amount,
  pusher_group
) VALUES (
  'abdevil',
  'ABdevil',
  '#f97316',
  true,
  50,
  1
)
ON CONFLICT (streamer_slug) DO NOTHING;

-- Create auth user for ABdevil streamer
INSERT INTO public.auth_users (email, password_hash, role, is_active)
VALUES ('abdevil@hyperchat.site', 'abdevil123', 'streamer', true)
ON CONFLICT (email) DO NOTHING;

-- Link the user to the abdevil streamer
UPDATE public.streamers
SET user_id = (SELECT id FROM auth_users WHERE email = 'abdevil@hyperchat.site')
WHERE streamer_slug = 'abdevil';