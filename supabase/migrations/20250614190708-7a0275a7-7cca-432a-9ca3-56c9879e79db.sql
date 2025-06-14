
-- Create chiaa_gaming_donations table
CREATE TABLE public.chiaa_gaming_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  order_id TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  include_sound BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chiaa_gaming_donations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for displaying donations)
CREATE POLICY "Allow public read access" 
  ON public.chiaa_gaming_donations 
  FOR SELECT 
  USING (true);

-- Create policy to allow public insert (for creating donations)
CREATE POLICY "Allow public insert" 
  ON public.chiaa_gaming_donations 
  FOR INSERT 
  WITH CHECK (true);
