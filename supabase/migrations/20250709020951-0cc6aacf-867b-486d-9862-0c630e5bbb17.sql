-- Temporarily disable the problematic trigger so manual data entry works
DROP TRIGGER IF EXISTS trigger_notify_telegram_new_donation ON public.chiaa_gaming_donations;