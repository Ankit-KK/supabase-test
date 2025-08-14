-- Create table for Chia Gaming donations
CREATE TABLE public.chia_gaming_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chia_gaming_donations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view donations" 
ON public.chia_gaming_donations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create donations" 
ON public.chia_gaming_donations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update donations" 
ON public.chia_gaming_donations 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chia_gaming_donations_updated_at
  BEFORE UPDATE ON public.chia_gaming_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();