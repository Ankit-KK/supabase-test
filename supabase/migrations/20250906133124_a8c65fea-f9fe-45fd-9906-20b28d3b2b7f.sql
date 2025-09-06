-- CRITICAL SECURITY FIX: Secure Donor Information from Public Access

-- ============= ANKIT DONATIONS =============
-- Remove dangerous public access policies
DROP POLICY IF EXISTS "Anyone can create ankit donations" ON public.ankit_donations;
DROP POLICY IF EXISTS "Anyone can update ankit donations" ON public.ankit_donations;
DROP POLICY IF EXISTS "Anyone can view ankit donations" ON public.ankit_donations;

-- Create secure policies for ankit_donations
CREATE POLICY "Allow donation creation"
ON public.ankit_donations
FOR INSERT
WITH CHECK (true); -- Allow donation creation but restrict everything else

CREATE POLICY "Streamers can view their donations"
ON public.ankit_donations
FOR SELECT
USING (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);

CREATE POLICY "System can update donation status"
ON public.ankit_donations
FOR UPDATE
USING (
  -- Only allow updates by streamer owners or system operations
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);

-- ============= CHIA GAMING DONATIONS =============
-- Remove dangerous public access policies
DROP POLICY IF EXISTS "Anyone can create donations" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Anyone can update donations" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Anyone can view donations" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Public can view all donations" ON public.chia_gaming_donations;

-- Create secure policies for chia_gaming_donations
CREATE POLICY "Allow donation creation"
ON public.chia_gaming_donations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Streamers can view their donations"
ON public.chia_gaming_donations
FOR SELECT
USING (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);

CREATE POLICY "System can update donation status"
ON public.chia_gaming_donations
FOR UPDATE
USING (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);

-- ============= NEWSTREAMER DONATIONS =============
-- Remove dangerous public access policies
DROP POLICY IF EXISTS "Anyone can create newstreamer donations" ON public.newstreamer_donations;
DROP POLICY IF EXISTS "Anyone can update newstreamer donations" ON public.newstreamer_donations;
DROP POLICY IF EXISTS "Anyone can view newstreamer donations" ON public.newstreamer_donations;