-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_notify_telegram_new_donation ON public.chiaa_gaming_donations;

-- Create trigger on chiaa_gaming_donations table to notify Telegram for pending donations
CREATE TRIGGER trigger_notify_telegram_new_donation
  AFTER INSERT OR UPDATE ON public.chiaa_gaming_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_telegram_new_donation();