-- Update the auto-approve function to approve ALL donations (not just hyperemotes)
CREATE OR REPLACE FUNCTION public.auto_approve_ankit_hyperemotes_iu()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-approve ALL donations
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
$$;

-- Update existing pending donations to auto-approved
UPDATE ankit_donations
SET 
  moderation_status = 'auto_approved',
  approved_by = 'system',
  approved_at = now()
WHERE moderation_status = 'pending' 
  AND payment_status = 'success';