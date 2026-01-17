-- Fix generate_session_token to include extensions schema for pgcrypto access
CREATE OR REPLACE FUNCTION public.generate_session_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN encode(extensions.gen_random_bytes(32), 'base64');
END;
$$;