-- Create auto-approval trigger for ankit_donations table to match other tables
CREATE TRIGGER auto_approve_ankit_hyperemotes_trigger
BEFORE INSERT ON public.ankit_donations
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_ankit_hyperemotes();