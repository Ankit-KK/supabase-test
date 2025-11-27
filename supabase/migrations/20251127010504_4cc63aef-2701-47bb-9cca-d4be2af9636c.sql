-- Create or replace function to auto-approve all Damask Plays donations when payment succeeds
CREATE OR REPLACE FUNCTION auto_approve_damask_plays_donations()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve all donations (text, voice, hyperemotes) when payment status is success
  IF NEW.payment_status = 'success' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'success') THEN
    NEW.moderation_status := 'auto_approved';
    NEW.approved_by := 'system';
    NEW.approved_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_approve_damask_plays_donations_trigger ON damask_plays_donations;

-- Create trigger for auto-approval on INSERT and UPDATE
CREATE TRIGGER auto_approve_damask_plays_donations_trigger
BEFORE INSERT OR UPDATE ON damask_plays_donations
FOR EACH ROW
EXECUTE FUNCTION auto_approve_damask_plays_donations();