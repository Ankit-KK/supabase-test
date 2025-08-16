-- Create OBS tokens table for better token management
CREATE TABLE public.obs_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Enable Row Level Security
ALTER TABLE public.obs_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Streamers can view their own tokens" 
ON public.obs_tokens 
FOR SELECT 
USING (streamer_id IN (
  SELECT id FROM public.streamers WHERE user_id = auth.uid()
));

CREATE POLICY "Streamers can create their own tokens" 
ON public.obs_tokens 
FOR INSERT 
WITH CHECK (streamer_id IN (
  SELECT id FROM public.streamers WHERE user_id = auth.uid()
));

CREATE POLICY "Streamers can update their own tokens" 
ON public.obs_tokens 
FOR UPDATE 
USING (streamer_id IN (
  SELECT id FROM public.streamers WHERE user_id = auth.uid()
));

CREATE POLICY "Public can view active tokens for alerts" 
ON public.obs_tokens 
FOR SELECT 
USING (is_active = true);

-- Create function to get streamer by OBS token
CREATE OR REPLACE FUNCTION public.get_streamer_by_obs_token_v2(token text)
RETURNS TABLE(id uuid, user_id uuid, streamer_slug text, streamer_name text, brand_color text, brand_logo_url text, obs_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url,
    ot.token as obs_token
  FROM public.streamers s
  INNER JOIN public.obs_tokens ot ON s.id = ot.streamer_id
  WHERE ot.token = get_streamer_by_obs_token_v2.token 
    AND ot.is_active = true;
END;
$function$;

-- Create function to get active token for streamer
CREATE OR REPLACE FUNCTION public.get_active_obs_token(streamer_id uuid)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT token
  FROM public.obs_tokens
  WHERE streamer_id = get_active_obs_token.streamer_id 
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
$function$;

-- Migrate existing obs_tokens from streamers table
INSERT INTO public.obs_tokens (streamer_id, token, is_active)
SELECT id, obs_token, true
FROM public.streamers
WHERE obs_token IS NOT NULL;