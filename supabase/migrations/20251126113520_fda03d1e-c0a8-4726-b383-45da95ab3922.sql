-- Drop the old hyperemote-only auto-approval function for ThunderX
DROP FUNCTION IF EXISTS auto_approve_thunderx_hyperemotes() CASCADE;

-- Create new auto-approval function that approves ALL ThunderX donations (like Ankit)
CREATE OR REPLACE FUNCTION auto_approve_thunderx_donations()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve ALL donations on both INSERT and UPDATE
  IF TG_OP = 'INSERT' THEN
    IF NEW.moderation_status IS NULL OR NEW.moderation_status = 'pending' THEN
      NEW.moderation_status := 'auto_approved';
      NEW.approved_by := 'system';
      NEW.approved_at := now();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.moderation_status, 'pending') = 'pending' THEN
      NEW.moderation_status := 'auto_approved';
      NEW.approved_by := 'system';
      NEW.approved_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the old trigger
DROP TRIGGER IF EXISTS auto_approve_thunderx_hyperemotes_trigger ON thunderx_donations;

-- Create new trigger that fires on both INSERT and UPDATE
CREATE TRIGGER auto_approve_thunderx_donations_trigger
  BEFORE INSERT OR UPDATE ON thunderx_donations
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_thunderx_donations();