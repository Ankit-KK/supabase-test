-- Create newstreamer_donations table with identical structure to ankit_donations
CREATE TABLE public.newstreamer_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  voice_duration_seconds INTEGER,
  payment_status TEXT DEFAULT 'pending'::text,
  moderation_status TEXT DEFAULT 'pending'::text,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  order_id TEXT,
  cashfree_order_id TEXT,
  temp_voice_data TEXT,
  message_visible BOOLEAN DEFAULT true,
  is_hyperemote BOOLEAN DEFAULT false,
  last_verification_attempt TIMESTAMP WITH TIME ZONE,
  auto_verified BOOLEAN DEFAULT false,
  mod_notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.newstreamer_donations ENABLE ROW LEVEL SECURITY;

-- Create policies for newstreamer_donations
CREATE POLICY "Anyone can view newstreamer donations" 
ON public.newstreamer_donations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create newstreamer donations" 
ON public.newstreamer_donations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update newstreamer donations" 
ON public.newstreamer_donations 
FOR UPDATE 
USING (true);

CREATE POLICY "Streamers can manage their newstreamer donations" 
ON public.newstreamer_donations 
FOR ALL 
USING (streamer_id IN ( SELECT s.id FROM streamers s WHERE (s.user_id = auth.uid())))
WITH CHECK (streamer_id IN ( SELECT s.id FROM streamers s WHERE (s.user_id = auth.uid())));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_newstreamer_donations_updated_at
BEFORE UPDATE ON public.newstreamer_donations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create auto-approve hyperemotes trigger
CREATE OR REPLACE FUNCTION public.auto_approve_newstreamer_hyperemotes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-approve hyperemotes
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER auto_approve_newstreamer_hyperemotes_trigger
BEFORE INSERT ON public.newstreamer_donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_newstreamer_hyperemotes();

-- Insert streamer record for newstreamer
INSERT INTO public.streamers (
  streamer_slug,
  streamer_name,
  brand_color,
  hyperemotes_enabled,
  hyperemotes_min_amount
) VALUES (
  'newstreamer',
  'New Streamer',
  '#10b981',
  true,
  50
);

-- Add table to realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.newstreamer_donations;