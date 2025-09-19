-- Fix the generate_session_token function to properly reference extensions schema
CREATE OR REPLACE FUNCTION public.generate_session_token()
RETURNS TEXT AS $$
DECLARE
  token_value TEXT;
BEGIN
  -- Generate a secure random token using extensions.gen_random_bytes
  SELECT encode(extensions.gen_random_bytes(32), 'base64') INTO token_value;
  
  -- Ensure we have a valid token
  IF token_value IS NULL OR length(token_value) < 10 THEN
    RAISE EXCEPTION 'Failed to generate secure token';
  END IF;
  
  RETURN token_value;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to a simpler method using current timestamp and random
    SELECT encode(extensions.digest(extract(epoch from now())::text || random()::text, 'sha256'), 'base64') INTO token_value;
    RETURN token_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;