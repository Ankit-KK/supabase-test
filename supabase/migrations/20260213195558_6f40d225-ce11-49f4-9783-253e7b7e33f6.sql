
-- Drop vulnerable INSERT policies
DROP POLICY "Anyone can create donations" ON looteriya_gaming_donations;
DROP POLICY "Anyone can create donations" ON chiaa_gaming_donations;
DROP POLICY "Anyone can create clumsy god donations" ON clumsy_god_donations;
DROP POLICY "Anyone can create wolfy donations" ON wolfy_donations;

-- Create restricted INSERT policies (only pending status allowed)
CREATE POLICY "Public can create pending donations"
  ON looteriya_gaming_donations FOR INSERT
  WITH CHECK (payment_status = 'pending' AND moderation_status = 'pending' AND mod_notified = false);

CREATE POLICY "Public can create pending donations"
  ON chiaa_gaming_donations FOR INSERT
  WITH CHECK (payment_status = 'pending' AND moderation_status = 'pending' AND mod_notified = false);

CREATE POLICY "Public can create pending donations"
  ON clumsy_god_donations FOR INSERT
  WITH CHECK (payment_status = 'pending' AND moderation_status = 'pending' AND mod_notified = false);

CREATE POLICY "Public can create pending donations"
  ON wolfy_donations FOR INSERT
  WITH CHECK (payment_status = 'pending' AND moderation_status = 'pending' AND mod_notified = false);

-- Delete the fake injected donations
DELETE FROM looteriya_gaming_donations
WHERE id IN (
  '208b35a4-097a-4737-98c1-fcf94802eb9b',
  '396f9487-e6bf-4da1-9d98-7c639df9ad36'
);
