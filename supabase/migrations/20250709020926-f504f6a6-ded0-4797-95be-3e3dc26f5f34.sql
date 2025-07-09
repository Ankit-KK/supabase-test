-- Install the net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS net;

-- Fix the notify_telegram_new_donation trigger function to remove problematic auth header
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
    
    -- Make HTTP request to notification function without auth header (function will handle auth internally)
    PERFORM net.http_post(
      url := 'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/donation-notification',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;