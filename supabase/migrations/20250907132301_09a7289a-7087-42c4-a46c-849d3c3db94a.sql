-- Add a function to send Telegram notifications when donations succeed
CREATE OR REPLACE FUNCTION public.notify_moderators_on_success()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  bot_token text;
  moderator_record RECORD;
  message_text text;
  keyboard jsonb;
  payload jsonb;
  url text;
  http_response record;
BEGIN
  -- Only trigger for chia_gaming_donations when payment_status changes to 'success'
  -- and moderation_status is 'pending' and it's not a hyperemote
  IF TG_TABLE_NAME = 'chia_gaming_donations' AND 
     NEW.payment_status = 'success' AND 
     (OLD.payment_status IS NULL OR OLD.payment_status != 'success') AND
     NEW.moderation_status = 'pending' AND 
     COALESCE(NEW.is_hyperemote, false) = false AND
     NEW.streamer_id IS NOT NULL THEN
    
    -- Get bot token from pg_config (this is a simplified approach)
    -- In practice, you'd want to store this securely
    -- For now, let's log that we need to send a notification
    RAISE LOG 'Donation % needs Telegram notification sent to moderators for streamer %', NEW.id, NEW.streamer_id;
    
    -- Mark that moderator notification is needed
    NEW.mod_notified = false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for chia_gaming_donations
DROP TRIGGER IF EXISTS notify_moderators_trigger ON public.chia_gaming_donations;
CREATE TRIGGER notify_moderators_trigger
  BEFORE UPDATE ON public.chia_gaming_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_moderators_on_success();

-- Also add an edge function to handle the actual notification sending
-- Since we can't directly call external APIs from triggers, we'll use a separate process