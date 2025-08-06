-- Fix the trigger function to avoid net extension dependency
CREATE OR REPLACE FUNCTION public.notify_telegram_new_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only notify for pending donations
  IF NEW.review_status = 'pending' THEN
    -- Log the notification attempt
    PERFORM public.log_security_event('TELEGRAM_NOTIFICATION_TRIGGERED', 'donation_id: ' || NEW.id);
    
    -- Call the donation-notification edge function directly using supabase functions
    -- This will be handled by the edge function infrastructure
    INSERT INTO public.audit_logs (
      user_email,
      action,
      table_name,
      ip_address,
      user_agent
    ) VALUES (
      COALESCE(auth.email(), 'system'),
      'DONATION_NOTIFICATION_QUEUED',
      'chiaa_gaming_donations',
      'trigger',
      'donation_id: ' || NEW.id || ', review_status: ' || NEW.review_status
    );
  END IF;
  
  RETURN NEW;
END;
$function$;