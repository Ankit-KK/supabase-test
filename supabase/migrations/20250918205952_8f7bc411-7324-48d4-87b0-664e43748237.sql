-- Enable pgcrypto extension for secure token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the generate_session_token function that was missing
CREATE OR REPLACE FUNCTION public.generate_session_token()
RETURNS TEXT AS $$
BEGIN
  -- Generate a secure random token using pgcrypto
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;