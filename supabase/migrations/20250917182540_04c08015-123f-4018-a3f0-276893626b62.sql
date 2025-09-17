-- Fix the trigger to use proper service role authentication
-- Remove the previous trigger and function first
DROP TRIGGER IF EXISTS ankit_donation_approved_trigger ON ankit_donations;
DROP FUNCTION IF EXISTS notify_ankit_donation_approved();

-- Create a simplified trigger that doesn't rely on HTTP extension
-- Instead, we'll use a different approach with WebSocket connection tracking
CREATE OR REPLACE FUNCTION log_ankit_donation_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Simply log when Ankit donations are approved for debugging
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status != 'approved' THEN
    RAISE LOG 'Ankit donation approved - ID: %, Name: %, Amount: %', NEW.id, NEW.name, NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the simplified trigger
CREATE TRIGGER ankit_donation_approved_log_trigger
  AFTER UPDATE ON ankit_donations
  FOR EACH ROW
  EXECUTE FUNCTION log_ankit_donation_approval();

-- Create a table to track active WebSocket connections (persistent across function restarts)
CREATE TABLE IF NOT EXISTS public.active_websocket_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_key TEXT UNIQUE NOT NULL,
  streamer_slug TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the connections table
ALTER TABLE public.active_websocket_connections ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage connections
CREATE POLICY "Service role can manage websocket connections" 
  ON public.active_websocket_connections 
  FOR ALL 
  USING (current_setting('role') = 'service_role');

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_websocket_connections_streamer 
  ON public.active_websocket_connections(streamer_slug);
CREATE INDEX IF NOT EXISTS idx_websocket_connections_expires 
  ON public.active_websocket_connections(expires_at);