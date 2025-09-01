-- Make hyperemote auto-approval robust on insert and update for ankit_donations
CREATE OR REPLACE FUNCTION public.auto_approve_ankit_hyperemotes_iu()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_hyperemote = true THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.moderation_status IS NULL OR NEW.moderation_status = 'pending' THEN
        NEW.moderation_status := 'auto_approved';
        NEW.approved_by := 'system';
        NEW.approved_at := now();
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      -- Only auto-approve on updates if the previous status was pending
      IF COALESCE(OLD.moderation_status, 'pending') = 'pending' THEN
        NEW.moderation_status := 'auto_approved';
        NEW.approved_by := 'system';
        NEW.approved_at := now();
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Replace old INSERT-only trigger with INSERT OR UPDATE trigger
DROP TRIGGER IF EXISTS auto_approve_ankit_hyperemotes_trigger ON public.ankit_donations;

CREATE TRIGGER auto_approve_ankit_hyperemotes_biu
BEFORE INSERT OR UPDATE ON public.ankit_donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_ankit_hyperemotes_iu();