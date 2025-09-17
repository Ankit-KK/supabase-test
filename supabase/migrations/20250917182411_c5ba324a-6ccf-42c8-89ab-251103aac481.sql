-- Create database trigger for automatic alert broadcasting
-- This ensures donations are broadcasted even if the approval function fails

CREATE OR REPLACE FUNCTION notify_ankit_donation_approved()
RETURNS TRIGGER AS $$
DECLARE
  function_url text;
  payload jsonb;
  result text;
BEGIN
  -- Only trigger for Ankit donations that are approved
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status != 'approved' THEN
    
    -- Log the trigger activation
    RAISE LOG 'Ankit donation approval trigger activated for donation ID: %', NEW.id;
    
    -- Call the WebSocket broadcast function via HTTP
    -- Note: This is a fallback mechanism when the approval function broadcast fails
    SELECT content INTO result FROM http((
      'POST',
      'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/ankit-obs-alerts',
      ARRAY[http_header('Content-Type', 'application/json'), http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))],
      'application/json',
      json_build_object('donation_id', NEW.id)::text
    )::http_request);
    
    -- Log the result
    RAISE LOG 'Ankit WebSocket broadcast trigger result: %', result;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on ankit_donations table
DROP TRIGGER IF EXISTS ankit_donation_approved_trigger ON ankit_donations;
CREATE TRIGGER ankit_donation_approved_trigger
  AFTER UPDATE ON ankit_donations
  FOR EACH ROW
  EXECUTE FUNCTION notify_ankit_donation_approved();

-- Enable the http extension if not already enabled (for trigger HTTP calls)
CREATE EXTENSION IF NOT EXISTS http;