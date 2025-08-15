-- Create dedicated streamers table
CREATE TABLE public.streamers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  streamer_slug TEXT UNIQUE NOT NULL,
  streamer_name TEXT NOT NULL,
  brand_color TEXT DEFAULT '#6366f1',
  brand_logo_url TEXT,
  obs_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.streamers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Streamers can manage their own data"
ON public.streamers
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Public can view streamers"
ON public.streamers
FOR SELECT
USING (true);

-- Create indexes
CREATE UNIQUE INDEX idx_streamers_slug ON public.streamers(streamer_slug);
CREATE INDEX idx_streamers_user_id ON public.streamers(user_id);

-- Insert Chia Gaming streamer
INSERT INTO public.streamers (streamer_slug, streamer_name, brand_color)
VALUES ('chia_gaming', 'Chia Gaming', '#22c55e');

-- Update donations table to reference streamers
ALTER TABLE public.chia_gaming_donations 
ADD COLUMN IF NOT EXISTS streamer_id UUID REFERENCES public.streamers(id);

-- Update existing donations to reference chia_gaming streamer
UPDATE public.chia_gaming_donations 
SET streamer_id = (SELECT id FROM public.streamers WHERE streamer_slug = 'chia_gaming')
WHERE streamer_id IS NULL;

-- Create index for better performance
CREATE INDEX idx_donations_streamer_id ON public.chia_gaming_donations(streamer_id);

-- Update function to get streamer by slug
CREATE OR REPLACE FUNCTION public.get_streamer_by_slug(slug TEXT)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  streamer_slug TEXT,
  streamer_name TEXT,
  brand_color TEXT,
  brand_logo_url TEXT,
  obs_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url,
    s.obs_token
  FROM public.streamers s
  WHERE s.streamer_slug = slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for donations
DROP POLICY IF EXISTS "Streamer-specific donations access" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Public can view donations by streamer slug" ON public.chia_gaming_donations;

CREATE POLICY "Streamers can manage their donations"
ON public.chia_gaming_donations
FOR ALL
USING (
  streamer_id IN (
    SELECT s.id FROM public.streamers s WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Public can view all donations"
ON public.chia_gaming_donations
FOR SELECT
USING (true);