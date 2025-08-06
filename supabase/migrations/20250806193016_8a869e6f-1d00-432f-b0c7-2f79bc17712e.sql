-- Create trigger for Chiaa Gaming donations to notify Telegram bot
CREATE TRIGGER notify_telegram_chiaa_gaming_donation
  AFTER INSERT OR UPDATE ON public.chiaa_gaming_donations
  FOR EACH ROW
  WHEN (NEW.review_status = 'pending')
  EXECUTE FUNCTION public.notify_telegram_new_donation();