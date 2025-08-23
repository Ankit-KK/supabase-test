-- Fix search path for auto_approve_hyperemotes function
CREATE OR REPLACE FUNCTION public.auto_approve_hyperemotes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Auto-approve hyperemotes
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;