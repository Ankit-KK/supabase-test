-- Fix: Grant execute on hash_session_token to anon and authenticated
-- This is safe because:
-- 1. hash_session_token is a pure function that just hashes text
-- 2. It doesn't expose any data
-- 3. It's needed for validate_session_token (SECURITY DEFINER) to work

GRANT EXECUTE ON FUNCTION public.hash_session_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.hash_session_token(text) TO authenticated;

-- Also ensure validate_session_token has proper permissions for all roles
GRANT EXECUTE ON FUNCTION public.validate_session_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_session_token(text) TO authenticated;