
-- Add gif_url column to chiaa_gaming_donations table
ALTER TABLE public.chiaa_gaming_donations 
ADD COLUMN gif_url TEXT;

-- Create donation_gifs table for tracking uploaded GIFs
CREATE TABLE public.donation_gifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES public.chiaa_gaming_donations(id) ON DELETE CASCADE,
  gif_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  displayed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'displayed', 'deleted'))
);

-- Enable RLS on donation_gifs table
ALTER TABLE public.donation_gifs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (needed for OBS overlay)
CREATE POLICY "Allow public read access to donation_gifs" 
  ON public.donation_gifs 
  FOR SELECT 
  USING (true);

-- Create policy for public insert (for uploading GIFs)
CREATE POLICY "Allow public insert to donation_gifs" 
  ON public.donation_gifs 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy for public update (for marking as displayed/deleted)
CREATE POLICY "Allow public update to donation_gifs" 
  ON public.donation_gifs 
  FOR UPDATE 
  USING (true);

-- Create storage bucket for temporary donation GIFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-gifs',
  'donation-gifs', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/gif']
);

-- Create storage policy for public read access
CREATE POLICY "Public read access for donation GIFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'donation-gifs');

-- Create storage policy for public upload
CREATE POLICY "Public upload for donation GIFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'donation-gifs');

-- Create storage policy for public delete (for cleanup)
CREATE POLICY "Public delete for donation GIFs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'donation-gifs');
