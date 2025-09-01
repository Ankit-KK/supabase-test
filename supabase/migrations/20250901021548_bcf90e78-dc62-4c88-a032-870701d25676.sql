-- Check and fix hyperemotes auto-approval for chia_gaming_donations
-- Ensure the trigger is properly set up and working

-- Recreate the trigger to ensure it's working correctly
DROP TRIGGER IF EXISTS auto_approve_hyperemotes_trigger ON public.chia_gaming_donations;

CREATE TRIGGER auto_approve_hyperemotes_trigger
  BEFORE INSERT ON public.chia_gaming_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_hyperemotes();