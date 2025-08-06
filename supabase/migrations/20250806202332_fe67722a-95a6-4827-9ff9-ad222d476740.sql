-- Update the trigger function to actually call the donation-notification edge function
CREATE OR REPLACE FUNCTION public.notify_telegram_new_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  payload jsonb;
  request_id bigint;
BEGIN
  -- Only notify for pending donations
  IF NEW.review_status = 'pending' THEN
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', 'chiaa_gaming_donations',
      'record', row_to_json(NEW)
    );
    
    -- Log the notification attempt
    PERFORM public.log_security_event('TELEGRAM_NOTIFICATION_TRIGGERED', 'donation_id: ' || NEW.id);
    
    -- Call the donation-notification edge function using pg_net if available
    -- If pg_net is not available, this will fail silently but log the attempt
    BEGIN
      SELECT net.http_post(
        url := 'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/donation-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZXZzanZ0cnNoZ2VpdWRybnRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjU4MTU4MSwiZXhwIjoyMDU4MTU3NTgxfQ.5dLJnq0_30Vgz7lsBHhGOLxJUdYA9nA2PO--LVayQYE"}'::jsonb,
        body := payload::text
      ) INTO request_id;
      
      -- Log successful call
      PERFORM public.log_security_event('TELEGRAM_NOTIFICATION_SENT', 'donation_id: ' || NEW.id || ', request_id: ' || request_id);
      
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the trigger
      PERFORM public.log_security_event('TELEGRAM_NOTIFICATION_ERROR', 'donation_id: ' || NEW.id || ', error: ' || SQLERRM);
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;