-- Drop the existing validate_session_token function first to allow parameter rename
DROP FUNCTION IF EXISTS public.validate_session_token(text);

-- Secure session token handling with hashing
-- Tokens are now stored as SHA-256 hashes, not plaintext

-- 1. Create a function to hash tokens using SHA-256
CREATE OR REPLACE FUNCTION public.hash_session_token(plain_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(sha256(plain_token::bytea), 'hex')
$$;

-- 2. Update generate_session_token to return a secure random token
CREATE OR REPLACE FUNCTION public.generate_session_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- 3. Create validate_session_token to compare hashed tokens
CREATE OR REPLACE FUNCTION public.validate_session_token(plain_token text)
RETURNS TABLE(user_id uuid, email text, username text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashed_token text;
BEGIN
  -- Hash the incoming token to compare with stored hash
  hashed_token := public.hash_session_token(plain_token);
  
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.username,
    au.role
  FROM public.auth_users au
  INNER JOIN public.auth_sessions ass ON au.id = ass.user_id
  WHERE ass.token = hashed_token
    AND ass.expires_at > now()
    AND au.is_active = true;
END;
$$;

-- 4. Create a function to store hashed session token
CREATE OR REPLACE FUNCTION public.create_session_with_hashed_token(
  p_user_id uuid,
  p_plain_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashed_token text;
BEGIN
  -- Hash the token before storing
  hashed_token := public.hash_session_token(p_plain_token);
  
  -- Delete any existing sessions for this user (single session policy)
  DELETE FROM public.auth_sessions WHERE user_id = p_user_id;
  
  -- Insert the new session with hashed token
  INSERT INTO public.auth_sessions (user_id, token, expires_at)
  VALUES (p_user_id, hashed_token, now() + interval '7 days');
END;
$$;

-- 5. Create a function for token rotation (refresh)
CREATE OR REPLACE FUNCTION public.rotate_session_token(old_plain_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_hashed_token text;
  session_user_id uuid;
  new_plain_token text;
  new_hashed_token text;
BEGIN
  -- Hash the old token to find the session
  old_hashed_token := public.hash_session_token(old_plain_token);
  
  -- Find the session and verify it's still valid
  SELECT user_id INTO session_user_id
  FROM public.auth_sessions
  WHERE token = old_hashed_token
    AND expires_at > now();
  
  IF session_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Generate a new token
  new_plain_token := encode(gen_random_bytes(32), 'base64');
  new_hashed_token := public.hash_session_token(new_plain_token);
  
  -- Update the session with the new hashed token and reset expiry
  UPDATE public.auth_sessions
  SET token = new_hashed_token,
      expires_at = now() + interval '7 days'
  WHERE token = old_hashed_token;
  
  -- Return the new plaintext token to the client
  RETURN new_plain_token;
END;
$$;

-- 6. Create a cleanup function for expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.auth_sessions
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 7. Hash existing plaintext tokens (migration of existing data)
UPDATE public.auth_sessions
SET token = encode(sha256(token::bytea), 'hex')
WHERE length(token) < 64;

-- 8. Add a comment to document the security model
COMMENT ON TABLE public.auth_sessions IS 'Session tokens are stored as SHA-256 hashes. The plaintext token is only known by the client. Token validation hashes the incoming token and compares with the stored hash.';

-- 9. Grant execute permissions
REVOKE ALL ON FUNCTION public.hash_session_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_session_with_hashed_token(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rotate_session_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_expired_sessions() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.hash_session_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_session_with_hashed_token(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rotate_session_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_session_token(text) TO service_role;