-- Drop old trigger that points to wrong function
DROP TRIGGER IF EXISTS auto_approve_ankit_hyperemotes ON ankit_donations;

-- Recreate trigger pointing to the correct function
CREATE TRIGGER auto_approve_ankit_hyperemotes_iu
  BEFORE INSERT OR UPDATE ON ankit_donations
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_ankit_hyperemotes_iu();

-- Clean up old function
DROP FUNCTION IF EXISTS auto_approve_ankit_hyperemotes();

-- Update existing pending donations to auto-approved
UPDATE ankit_donations
SET 
  moderation_status = 'auto_approved',
  approved_by = 'system',
  approved_at = now()
WHERE moderation_status = 'pending' 
  AND payment_status = 'success';