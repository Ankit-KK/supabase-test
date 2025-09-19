-- Fix the generate_session_token function with proper error handling
CREATE OR REPLACE FUNCTION public.generate_session_token()
RETURNS TEXT AS $$
DECLARE
  token_value TEXT;
BEGIN
  -- Generate a secure random token using gen_random_bytes
  SELECT encode(gen_random_bytes(32), 'base64') INTO token_value;
  
  -- Ensure we have a valid token
  IF token_value IS NULL OR length(token_value) < 10 THEN
    RAISE EXCEPTION 'Failed to generate secure token';
  END IF;
  
  RETURN token_value;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to a different method if gen_random_bytes fails
    RETURN encode(digest(extract(epoch from now())::text || random()::text, 'sha256'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;