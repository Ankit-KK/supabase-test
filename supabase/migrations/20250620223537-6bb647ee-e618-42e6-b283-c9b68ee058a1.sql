
-- Fix RLS policies for donation_gifs table to allow OBS overlay operations
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read donation_gifs" ON public.donation_gifs;
DROP POLICY IF EXISTS "Authenticated users can insert donation_gifs" ON public.donation_gifs;
DROP POLICY IF EXISTS "Authenticated users can update donation_gifs" ON public.donation_gifs;

-- Create new policies that allow public access for OBS functionality
CREATE POLICY "Allow public read access to donation_gifs" 
  ON public.donation_gifs 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Allow public insert to donation_gifs" 
  ON public.donation_gifs 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow public update to donation_gifs" 
  ON public.donation_gifs 
  FOR UPDATE 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow public delete to donation_gifs" 
  ON public.donation_gifs 
  FOR DELETE 
  TO anon, authenticated 
  USING (true);
