-- Create auto-approval function for ABdevil donations
CREATE OR REPLACE FUNCTION public.auto_approve_abdevil_donations()
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

-- Create trigger for ABdevil donations
DROP TRIGGER IF EXISTS auto_approve_abdevil_donations_trigger ON public.abdevil_donations;

CREATE TRIGGER auto_approve_abdevil_donations_trigger
BEFORE INSERT OR UPDATE ON public.abdevil_donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_abdevil_donations();