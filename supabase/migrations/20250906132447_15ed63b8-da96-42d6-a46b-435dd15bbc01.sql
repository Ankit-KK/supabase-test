-- Security Improvements: Fix RLS Policies (Part 2)

-- Fix the conflicting policy name for chia_gaming_donations
DROP POLICY IF EXISTS "Streamers can manage their donations" ON public.chia_gaming_donations;

CREATE POLICY "Streamers can manage their own donations"
ON public.chia_gaming_donations
FOR ALL
USING (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);

-- Also fix newstreamer donations to have proper streamer management
CREATE POLICY "Streamers can manage their newstreamer donations"
ON public.newstreamer_donations
FOR ALL
USING (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
)
WITH CHECK (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);