-- Create demostreamer_donations table with same structure as ankit_donations
CREATE TABLE public.demostreamer_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  order_id TEXT,
  cashfree_order_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  is_hyperemote BOOLEAN DEFAULT false,
  message_visible BOOLEAN DEFAULT true,
  voice_message_url TEXT,
  voice_duration_seconds INTEGER,
  temp_voice_data TEXT,
  tts_audio_url TEXT,
  tts_segments JSONB,
  emotion_tags TEXT[],
  emotion_tier TEXT DEFAULT 'basic',
  processing_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  mod_notified BOOLEAN NOT NULL DEFAULT false,
  last_verification_attempt TIMESTAMP WITH TIME ZONE,
  auto_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.demostreamer_donations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies matching ankit_donations patterns
CREATE POLICY "Admins full access to demostreamer_donations" 
ON public.demostreamer_donations 
FOR ALL 
USING (is_admin_email(auth.email()))
WITH CHECK (is_admin_email(auth.email()));

CREATE POLICY "Allow secure donation creation on demostreamer_donations" 
ON public.demostreamer_donations 
FOR INSERT 
WITH CHECK (
  validate_donation_insert(amount, name, message, streamer_id) AND 
  payment_status = 'pending' AND 
  moderation_status = 'pending'
);

CREATE POLICY "Deny anonymous read access to demostreamer_donations" 
ON public.demostreamer_donations 
FOR SELECT 
USING (false);

CREATE POLICY "Deny anonymous update/delete on demostreamer_donations" 
ON public.demostreamer_donations 
FOR UPDATE 
USING (false);

CREATE POLICY "Deny anonymous delete on demostreamer_donations" 
ON public.demostreamer_donations 
FOR DELETE 
USING (false);

CREATE POLICY "Service role can update payment status demostreamer" 
ON public.demostreamer_donations 
FOR UPDATE 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Streamers view own demostreamer_donations" 
ON public.demostreamer_donations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Streamers limited update on demostreamer_donations" 
ON public.demostreamer_donations 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  streamer_id IN (
    SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()
  )
);

-- Create auto-approval trigger for hyperemotes
CREATE OR REPLACE FUNCTION public.auto_approve_demostreamer_hyperemotes()
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

CREATE TRIGGER auto_approve_demostreamer_hyperemotes_trigger
BEFORE INSERT OR UPDATE ON public.demostreamer_donations
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_demostreamer_hyperemotes();

-- Create audit trigger
CREATE TRIGGER log_demostreamer_donation_changes
AFTER INSERT OR UPDATE OR DELETE ON public.demostreamer_donations
FOR EACH ROW EXECUTE FUNCTION public.log_donation_modification();

-- Create updated_at trigger
CREATE TRIGGER update_demostreamer_donations_updated_at
BEFORE UPDATE ON public.demostreamer_donations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demostreamer record
INSERT INTO public.streamers (
  streamer_slug,
  streamer_name,
  brand_color,
  hyperemotes_enabled,
  hyperemotes_min_amount
) VALUES (
  'demostreamer',
  'Demo Streamer',
  '#8b5cf6',
  true,
  50
) ON CONFLICT (streamer_slug) DO NOTHING;