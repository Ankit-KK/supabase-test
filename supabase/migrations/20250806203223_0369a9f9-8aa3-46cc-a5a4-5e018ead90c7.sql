-- Update the trigger function to send notifications for both pending and failed payments
CREATE OR REPLACE FUNCTION public.notify_telegram_new_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  payload jsonb;
  request_id bigint;
BEGIN
  -- Notify for pending donations OR when payment status changes to failure and needs review
  IF NEW.review_status = 'pending' OR 
     (NEW.payment_status = 'failure' AND NEW.review_status = 'pending') OR
     (TG_OP = 'UPDATE' AND OLD.payment_status != 'failure' AND NEW.payment_status = 'failure' AND NEW.review_status = 'pending') THEN
    
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', 'chiaa_gaming_donations',
      'record', row_to_json(NEW)
    );
    
    -- Log the notification attempt
    PERFORM public.log_security_event('TELEGRAM_NOTIFICATION_TRIGGERED', 'donation_id: ' || NEW.id || ', payment_status: ' || NEW.payment_status);
    
    -- Call the donation-notification edge function using pg_net
    BEGIN
      SELECT net.http_post(
        url := 'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/donation-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZXZzanZ0cnNoZ2VpdWRybnRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjU4MTU4MSwiZXhwIjoyMDU4MTU3NTgxfQ.5dLJnq0_30Vgz7lsBHhGOLxJUdYA9nA2PO--LVayQYE"}'::jsonb,
        body := payload::text
      ) INTO request_id;
      
      -- Log successful call
      PERFORM public.log_security_event('TELEGRAM_NOTIFICATION_SENT', 'donation_id: ' || NEW.id || ', request_id: ' || request_id || ', payment_status: ' || NEW.payment_status);
      
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the trigger
      PERFORM public.log_security_event('TELEGRAM_NOTIFICATION_ERROR', 'donation_id: ' || NEW.id || ', error: ' || SQLERRM || ', payment_status: ' || NEW.payment_status);
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;