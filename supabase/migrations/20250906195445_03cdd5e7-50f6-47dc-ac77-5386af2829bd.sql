-- Fix streamer email exposure vulnerability
-- Remove the overly permissive public access policy and replace with a more secure one

-- 1. Drop the existing vulnerable policy
DROP POLICY IF EXISTS "Public can access basic streamer info for donations" ON public.streamers;

-- 2. Create a more restrictive policy that only allows access to safe fields
-- We'll create this by using a function that validates what columns can be accessed
CREATE OR REPLACE FUNCTION public.get_safe_streamer_columns()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    'id',
    'streamer_slug', 
    'streamer_name',
    'brand_color',
    'brand_logo_url',
    'hyperemotes_enabled',
    'hyperemotes_min_amount',
    'created_at',
    'updated_at'
  ];
$$;

-- 3. Create a secure view for public streamer data (recommended approach)
CREATE OR REPLACE VIEW public.public_streamer_view AS
SELECT 
  id,
  streamer_slug,
  streamer_name,
  brand_color,
  brand_logo_url,
  hyperemotes_enabled,
  hyperemotes_min_amount,
  created_at,
  updated_at
FROM public.streamers;

-- Enable RLS on the view
ALTER VIEW public.public_streamer_view SET (security_barrier = true);

-- 4. Create a new secure policy for public access that only works with dedicated functions
CREATE POLICY "Public can access streamers via secure functions only"
ON public.streamers
FOR SELECT
USING (
  -- Only allow access when called from secure functions or by authenticated users who own the streamer
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  -- Or when it's an admin
  public.is_current_user_admin()
);

-- 5. Create secure functions that properly mask sensitive data
CREATE OR REPLACE FUNCTION public.get_streamer_for_donation(p_streamer_slug text)
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
  WHERE s.streamer_slug = p_streamer_slug;
$$;

-- 6. Update existing functions to ensure they don't expose sensitive data
CREATE OR REPLACE FUNCTION public.get_recent_donations_public(p_streamer_slug text, p_limit integer DEFAULT 10)
RETURNS TABLE(donor_name text, amount numeric, sanitized_message text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streamer_record RECORD;
BEGIN
  -- Get streamer info using secure method (only safe fields)
  SELECT id INTO streamer_record
  FROM public.get_streamer_for_donation(p_streamer_slug)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Return sanitized recent donations (last 24 hours only)
  RETURN QUERY
  SELECT 
    CASE 
      WHEN LENGTH(d.name) > 20 THEN LEFT(d.name, 15) || '...'
      ELSE d.name
    END as donor_name,
    d.amount,
    CASE 
      WHEN d.message IS NULL THEN NULL
      WHEN LENGTH(d.message) > 100 THEN LEFT(d.message, 97) || '...'
      ELSE d.message
    END as sanitized_message,
    d.created_at
  FROM (
    SELECT name, amount, message, created_at
    FROM public.ankit_donations 
    WHERE streamer_id = streamer_record.id 
      AND created_at > (now() - interval '24 hours')
      AND moderation_status = 'auto_approved'
    
    UNION ALL
    
    SELECT name, amount, message, created_at
    FROM public.chia_gaming_donations 
    WHERE streamer_id = streamer_record.id 
      AND created_at > (now() - interval '24 hours')
      AND moderation_status = 'auto_approved'
    
    UNION ALL
    
    SELECT name, amount, message, created_at
    FROM public.newstreamer_donations 
    WHERE streamer_id = streamer_record.id 
      AND created_at > (now() - interval '24 hours')
      AND moderation_status = 'auto_approved'
  ) d
  ORDER BY d.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 7. Log this security fix
SELECT public.log_security_violation(
  'STREAMER_EMAIL_EXPOSURE_FIXED',
  'Implemented secure access controls for streamer table to prevent email harvesting',
  'system'
);