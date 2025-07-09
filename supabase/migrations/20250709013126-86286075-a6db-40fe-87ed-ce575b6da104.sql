-- Create function to call edge function for new donations
CREATE OR REPLACE FUNCTION public.notify_telegram_new_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Only notify for pending donations
  IF NEW.review_status = 'pending' THEN
    payload := jsonb_build_object(
      'type', 'INSERT',
      'table', 'chiaa_gaming_donations',
      'record', row_to_json(NEW)
    );
    
    -- Log the notification attempt
    PERFORM public.log_security_event('TELEGRAM_NOTIFICATION_TRIGGERED', 'donation_id: ' || NEW.id);
    
    -- Make HTTP request to notification function
    PERFORM net.http_post(
      url := 'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/donation-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}'::jsonb,
      body := payload::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new donations
DROP TRIGGER IF EXISTS trigger_notify_telegram_new_donation ON public.chiaa_gaming_donations;
CREATE TRIGGER trigger_notify_telegram_new_donation
  AFTER INSERT ON public.chiaa_gaming_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_telegram_new_donation();