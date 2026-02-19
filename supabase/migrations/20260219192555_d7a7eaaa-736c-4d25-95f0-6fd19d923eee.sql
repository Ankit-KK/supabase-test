
-- Drop the broken restrictive policies
DROP POLICY IF EXISTS "Anyone can view approved brigzard donations" ON brigzard_donations;
DROP POLICY IF EXISTS "Service role can manage brigzard donations" ON brigzard_donations;

-- Recreate as PERMISSIVE policies (matching the working pattern from wolfy_donations, w_era_donations, etc.)
CREATE POLICY "Anyone can view approved brigzard donations"
  ON brigzard_donations
  FOR SELECT
  TO anon, authenticated
  USING (
    moderation_status = ANY (ARRAY['approved'::text, 'auto_approved'::text]) 
    AND payment_status = 'success'
  );

CREATE POLICY "Service role can manage brigzard donations"
  ON brigzard_donations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
