-- Update streamers_moderators RLS policy to allow email-based auth like other functions
DROP POLICY IF EXISTS "Streamers can manage their own moderators" ON public.streamers_moderators;

CREATE POLICY "Streamers can manage their own moderators" 
ON public.streamers_moderators
FOR ALL 
USING (
  -- Allow if user owns the streamer
  (streamer_id IN (
    SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()
  ))
  OR
  -- Allow if user's email is authorized for this streamer
  (streamer_id IN (
    SELECT s.id 
    FROM streamers s 
    WHERE s.streamer_slug IN (
      SELECT CASE 
        WHEN auth.email() ILIKE '%ankit%' THEN 'ankit'
        WHEN auth.email() ILIKE '%chia%' OR auth.email() ILIKE '%gaming%' THEN 'chia_gaming'
        ELSE NULL
      END
    )
  ))
  OR
  -- Allow if user is admin
  public.is_admin_email(auth.email())
)
WITH CHECK (
  -- Same check for inserts/updates
  (streamer_id IN (
    SELECT s.id FROM streamers s WHERE s.user_id = auth.uid()
  ))
  OR
  (streamer_id IN (
    SELECT s.id 
    FROM streamers s 
    WHERE s.streamer_slug IN (
      SELECT CASE 
        WHEN auth.email() ILIKE '%ankit%' THEN 'ankit'
        WHEN auth.email() ILIKE '%chia%' OR auth.email() ILIKE '%gaming%' THEN 'chia_gaming'
        ELSE NULL
      END
    )
  ))
  OR
  public.is_admin_email(auth.email())
);