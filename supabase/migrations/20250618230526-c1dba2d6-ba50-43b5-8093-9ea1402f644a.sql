
-- Create ankit_donations table
CREATE TABLE public.ankit_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  payment_id TEXT,
  order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chiaa_gaming_donations table  
CREATE TABLE public.chiaa_gaming_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  payment_id TEXT,
  order_id TEXT,
  gif_url TEXT,
  voice_url TEXT,
  voice_file_name TEXT,
  voice_file_size INTEGER,
  custom_sound_name TEXT,
  custom_sound_url TEXT,
  include_sound BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create donation_gifs table
CREATE TABLE public.donation_gifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES public.chiaa_gaming_donations(id) ON DELETE CASCADE,
  gif_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT DEFAULT 'gif' CHECK (file_type IN ('gif', 'voice')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  displayed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'displayed', 'deleted'))
);

-- Create streamer_contracts table
CREATE TABLE public.streamer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_type TEXT NOT NULL,
  streamer_name TEXT NOT NULL,
  signature TEXT NOT NULL,
  agreed_to_terms BOOLEAN DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  streamer_cut DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  hyperchat_cut DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ankit_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chiaa_gaming_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_gifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streamer_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (needed for donation functionality)
CREATE POLICY "Allow public read access to ankit_donations" 
  ON public.ankit_donations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert to ankit_donations" 
  ON public.ankit_donations 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update to ankit_donations" 
  ON public.ankit_donations 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public read access to chiaa_gaming_donations" 
  ON public.chiaa_gaming_donations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert to chiaa_gaming_donations" 
  ON public.chiaa_gaming_donations 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update to chiaa_gaming_donations" 
  ON public.chiaa_gaming_donations 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public read access to donation_gifs" 
  ON public.donation_gifs 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert to donation_gifs" 
  ON public.donation_gifs 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update to donation_gifs" 
  ON public.donation_gifs 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public read access to streamer_contracts" 
  ON public.streamer_contracts 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert to streamer_contracts" 
  ON public.streamer_contracts 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update to streamer_contracts" 
  ON public.streamer_contracts 
  FOR UPDATE 
  USING (true);

-- Create storage bucket for donation GIFs and voice recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-gifs',
  'donation-gifs', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/gif', 'audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public access
CREATE POLICY "Public read access for donation GIFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'donation-gifs');

CREATE POLICY "Public upload for donation GIFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'donation-gifs');

CREATE POLICY "Public delete for donation GIFs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'donation-gifs');

-- Enable realtime for donation tables
ALTER TABLE public.ankit_donations REPLICA IDENTITY FULL;
ALTER TABLE public.chiaa_gaming_donations REPLICA IDENTITY FULL;

ALTER publication supabase_realtime ADD TABLE public.ankit_donations;
ALTER publication supabase_realtime ADD TABLE public.chiaa_gaming_donations;
