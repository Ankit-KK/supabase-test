-- Create table for tracking active WebSocket connections
CREATE TABLE public.active_websocket_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_key TEXT NOT NULL UNIQUE,
  streamer_id UUID NOT NULL,
  streamer_slug TEXT NOT NULL,
  streamer_name TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_ping_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.active_websocket_connections ENABLE ROW LEVEL SECURITY;

-- Create policy for system access (service role)
CREATE POLICY "System can manage websocket connections"
  ON public.active_websocket_connections
  FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- Create index for efficient queries
CREATE INDEX idx_active_websocket_connections_streamer_slug 
  ON public.active_websocket_connections(streamer_slug);
CREATE INDEX idx_active_websocket_connections_expires_at 
  ON public.active_websocket_connections(expires_at);

-- Create function to cleanup expired connections
CREATE OR REPLACE FUNCTION public.cleanup_expired_websocket_connections()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.active_websocket_connections 
  WHERE expires_at < now();
END;
$$;