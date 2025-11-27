-- Fix search_path for auto_approve_damask_plays_donations function
CREATE OR REPLACE FUNCTION auto_approve_damask_plays_donations()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve all donations (text, voice, hyperemotes) when payment succeeds
  IF NEW.payment_status = 'success' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'success') THEN
    NEW.moderation_status := 'auto_approved';
    NEW.approved_by := 'system';
    NEW.approved_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public';