-- Create trigger to auto-approve hyperemotes on donation insert
CREATE TRIGGER auto_approve_hyperemotes_trigger
  BEFORE INSERT ON public.chia_gaming_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_hyperemotes();