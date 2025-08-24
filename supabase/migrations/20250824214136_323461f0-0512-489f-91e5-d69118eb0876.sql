-- Drop duplicate trigger
DROP TRIGGER IF EXISTS trigger_auto_approve_hyperemotes ON public.chia_gaming_donations;

-- Ensure the correct trigger exists (drop and recreate to be safe)
DROP TRIGGER IF EXISTS auto_approve_hyperemotes_trigger ON public.chia_gaming_donations;

-- Create the trigger to auto-approve hyperemotes on donation insert
CREATE TRIGGER auto_approve_hyperemotes_trigger
  BEFORE INSERT ON public.chia_gaming_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_hyperemotes();