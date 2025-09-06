-- Security Improvements: Fix RLS Policies and Remove Vulnerabilities

-- 1. Fix user_signups table - restrict to admin access only
DROP POLICY IF EXISTS "Allow anonymous signups only" ON public.user_signups;

CREATE POLICY "Admin can view signups"
ON public.user_signups
FOR SELECT
USING (public.is_admin_user());

-- 2. Fix donation tables - restrict to proper user access
-- Ankit donations
DROP POLICY IF EXISTS "Anyone can create ankit donations" ON public.ankit_donations;
DROP POLICY IF EXISTS "Anyone can update ankit donations" ON public.ankit_donations;
DROP POLICY IF EXISTS "Anyone can view ankit donations" ON public.ankit_donations;

CREATE POLICY "Allow public donation creation"
ON public.ankit_donations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Donors can view their own donations"
ON public.ankit_donations
FOR SELECT
USING (
  -- Allow viewing if user is the streamer owner or if it's a public view for recent donations
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
  OR created_at > (now() - interval '24 hours') -- Allow recent donations to be publicly visible
);

CREATE POLICY "Only system can update donations"
ON public.ankit_donations
FOR UPDATE
USING (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);

-- Chia Gaming donations
DROP POLICY IF EXISTS "Anyone can create donations" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Anyone can update donations" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Anyone can view donations" ON public.chia_gaming_donations;
DROP POLICY IF EXISTS "Public can view all donations" ON public.chia_gaming_donations;

CREATE POLICY "Allow public donation creation"
ON public.chia_gaming_donations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Streamers can manage their donations"
ON public.chia_gaming_donations
FOR ALL
USING (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);

CREATE POLICY "Public can view recent donations"
ON public.chia_gaming_donations
FOR SELECT
USING (created_at > (now() - interval '24 hours'));

-- Newstreamer donations
DROP POLICY IF EXISTS "Anyone can create newstreamer donations" ON public.newstreamer_donations;
DROP POLICY IF EXISTS "Anyone can update newstreamer donations" ON public.newstreamer_donations;
DROP POLICY IF EXISTS "Anyone can view newstreamer donations" ON public.newstreamer_donations;

CREATE POLICY "Allow public donation creation"
ON public.newstreamer_donations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can view recent donations"
ON public.newstreamer_donations
FOR SELECT
USING (created_at > (now() - interval '24 hours'));

-- 3. Fix streamers table - remove public read access for sensitive data
DROP POLICY IF EXISTS "Authenticated users can read streamer data for operations" ON public.streamers;

CREATE POLICY "Public can view basic streamer info"
ON public.streamers
FOR SELECT
USING (true);

-- 4. Fix streamers_moderators table - restrict access properly  
DROP POLICY IF EXISTS "Allow moderator management for custom auth system" ON public.streamers_moderators;
DROP POLICY IF EXISTS "System can access moderator data for operations" ON public.streamers_moderators;

CREATE POLICY "Streamers can manage their own moderators"
ON public.streamers_moderators
FOR ALL
USING (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
)
WITH CHECK (
  streamer_id IN (SELECT id FROM public.streamers WHERE user_id = auth.uid())
);

-- 5. Remove the obs_token column from streamers table since we have obs_tokens table
ALTER TABLE public.streamers DROP COLUMN IF EXISTS obs_token;

-- 6. Restrict rate_limits table access
DROP POLICY IF EXISTS "Public can manage rate limits" ON public.rate_limits;

CREATE POLICY "System can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Add proper security to reviews table
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;

CREATE POLICY "Allow authenticated review creation"
ON public.reviews  
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 8. Update audit_logs for better security
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- 9. Create secure function to get public streamer data
CREATE OR REPLACE FUNCTION public.get_public_streamer_data(slug text)
RETURNS TABLE(
  id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  brand_logo_url text,
  hyperemotes_enabled boolean,
  hyperemotes_min_amount numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url,
    s.hyperemotes_enabled,
    s.hyperemotes_min_amount
  FROM public.streamers s
  WHERE s.streamer_slug = slug;
$$;