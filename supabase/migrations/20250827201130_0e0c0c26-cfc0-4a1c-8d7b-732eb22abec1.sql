-- Create new donations table for ankit streamer
CREATE TABLE IF NOT EXISTS public.ankit_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  payment_status TEXT DEFAULT 'pending'::text,
  moderation_status TEXT DEFAULT 'pending'::text,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  streamer_id UUID,
  cashfree_order_id TEXT,
  temp_voice_data TEXT,
  voice_message_url TEXT,
  voice_duration_seconds INTEGER,
  message_visible BOOLEAN DEFAULT true,
  is_hyperemote BOOLEAN DEFAULT false,
  last_verification_attempt TIMESTAMP WITH TIME ZONE,
  auto_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ankit_donations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies similar to chia_gaming_donations
CREATE POLICY "Anyone can create donations" 
ON public.ankit_donations 
FOR INSERT 
USING (true);

CREATE POLICY "Anyone can update donations" 
ON public.ankit_donations 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view donations" 
ON public.ankit_donations 
FOR SELECT 
USING (true);

CREATE POLICY "Streamers can manage their donations" 
ON public.ankit_donations 
FOR ALL 
USING (streamer_id IN (SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ankit_donations_updated_at
BEFORE UPDATE ON public.ankit_donations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create auto-approve trigger for hyperemotes
CREATE OR REPLACE FUNCTION public.auto_approve_ankit_hyperemotes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Auto-approve hyperemotes
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_approve_ankit_hyperemotes_trigger
BEFORE INSERT ON public.ankit_donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_ankit_hyperemotes();

-- Insert new streamer record for ankit
INSERT INTO public.streamers (
  streamer_slug,
  streamer_name,
  brand_color,
  hyperemotes_enabled,
  hyperemotes_min_amount,
  created_at,
  updated_at
) VALUES (
  'ankit',
  'Ankit',
  '#3b82f6',
  true,
  50,
  now(),
  now()
) ON CONFLICT (streamer_slug) DO NOTHING;

-- Enable realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.ankit_donations;