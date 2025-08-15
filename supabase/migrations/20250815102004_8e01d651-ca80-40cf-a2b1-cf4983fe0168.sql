-- Add streamer slug and branding support
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streamer_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS streamer_name TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS brand_logo_url TEXT;

-- Create unique index for streamer slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_streamer_slug 
ON public.profiles(streamer_slug) 
WHERE streamer_slug IS NOT NULL;

-- Update existing Chia Gaming data
UPDATE public.profiles 
SET 
  streamer_slug = 'chia_gaming',
  streamer_name = 'Chia Gaming',
  brand_color = '#22c55e',
  is_streamer = true
WHERE email IN (
  SELECT DISTINCT email FROM public.user_signups 
  WHERE email IS NOT NULL
  LIMIT 1
);

-- Add streamer_slug to donations table and update existing data
ALTER TABLE public.chia_gaming_donations 
ADD COLUMN IF NOT EXISTS streamer_slug TEXT DEFAULT 'chia_gaming';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chia_gaming_donations_streamer_slug 
ON public.chia_gaming_donations(streamer_slug);

-- Create function to get streamer by slug
CREATE OR REPLACE FUNCTION public.get_streamer_by_slug(slug TEXT)
RETURNS TABLE(
  id UUID,
  streamer_slug TEXT,
  streamer_name TEXT,
  brand_color TEXT,
  brand_logo_url TEXT,
  obs_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.streamer_slug,
    p.streamer_name,
    p.brand_color,
    p.brand_logo_url,
    p.obs_token
  FROM public.profiles p
  WHERE p.streamer_slug = slug AND p.is_streamer = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for streamer-specific access
DROP POLICY IF EXISTS "Streamer-specific donations access" ON public.chia_gaming_donations;
CREATE POLICY "Streamer-specific donations access" 
ON public.chia_gaming_donations 
FOR ALL
USING (
  streamer_slug IN (
    SELECT p.streamer_slug 
    FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.is_streamer = true
  )
);

-- Policy for public donation viewing by slug
DROP POLICY IF EXISTS "Public can view donations by streamer slug" ON public.chia_gaming_donations;
CREATE POLICY "Public can view donations by streamer slug" 
ON public.chia_gaming_donations 
FOR SELECT 
USING (true);