-- Create demo2_donations table
CREATE TABLE public.demo2_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  order_id TEXT,
  temp_voice_data TEXT,
  streamer_id UUID,
  is_hyperemote BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  message_visible BOOLEAN DEFAULT true,
  audio_played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for demo2_donations
ALTER TABLE public.demo2_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policy for demo2_donations
CREATE POLICY "Anyone can view approved donations" 
ON public.demo2_donations 
FOR SELECT 
USING (
  (moderation_status = ANY (ARRAY['approved'::text, 'auto_approved'::text])) 
  AND (payment_status = 'success'::text)
);

-- Create demo3_donations table
CREATE TABLE public.demo3_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  order_id TEXT,
  temp_voice_data TEXT,
  streamer_id UUID,
  is_hyperemote BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  message_visible BOOLEAN DEFAULT true,
  audio_played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for demo3_donations
ALTER TABLE public.demo3_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policy for demo3_donations
CREATE POLICY "Anyone can view approved donations" 
ON public.demo3_donations 
FOR SELECT 
USING (
  (moderation_status = ANY (ARRAY['approved'::text, 'auto_approved'::text])) 
  AND (payment_status = 'success'::text)
);

-- Create demo4_donations table
CREATE TABLE public.demo4_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  voice_message_url TEXT,
  tts_audio_url TEXT,
  payment_status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',
  approved_by TEXT,
  order_id TEXT,
  temp_voice_data TEXT,
  streamer_id UUID,
  is_hyperemote BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  message_visible BOOLEAN DEFAULT true,
  audio_played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for demo4_donations
ALTER TABLE public.demo4_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policy for demo4_donations
CREATE POLICY "Anyone can view approved donations" 
ON public.demo4_donations 
FOR SELECT 
USING (
  (moderation_status = ANY (ARRAY['approved'::text, 'auto_approved'::text])) 
  AND (payment_status = 'success'::text)
);

-- Insert streamer entries
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color, hyperemotes_enabled, hyperemotes_min_amount)
VALUES 
  ('demo2', 'Demo Streamer 2', '#06b6d4', true, 50),
  ('demo3', 'Demo Streamer 3', '#10b981', true, 50),
  ('demo4', 'Demo Streamer 4', '#f43f5e', true, 50);