-- Replace the Neko Xenpai auto-approval function to approve ALL donations
CREATE OR REPLACE FUNCTION public.auto_approve_neko_xenpai_donations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS auto_approve_hyperemotes ON neko_xenpai_donations;

-- Create new trigger for all donations
CREATE TRIGGER auto_approve_all_donations
BEFORE INSERT OR UPDATE ON neko_xenpai_donations
FOR EACH ROW
EXECUTE FUNCTION auto_approve_neko_xenpai_donations();