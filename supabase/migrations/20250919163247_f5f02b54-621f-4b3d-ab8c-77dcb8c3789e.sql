-- Link ankit streamer to the correct user and fix dashboard authorization
UPDATE streamers 
SET user_id = '88f92748-3245-4cea-b0c9-a8cd568dda56' 
WHERE streamer_slug = 'ankit';

-- Create a function to get current custom auth user ID from session
CREATE OR REPLACE FUNCTION public.get_current_custom_user_id()
RETURNS UUID AS $$
DECLARE
  session_token TEXT;
  user_record RECORD;
BEGIN
  -- Try to get token from request headers (this would need to be set by the application)
  session_token := current_setting('request.jwt.claims', true)::json->>'session_token';
  
  IF session_token IS NOT NULL THEN
    -- Get user from valid session
    SELECT au.id INTO user_record
    FROM auth_sessions as_table
    JOIN auth_users au ON as_table.user_id = au.id
    WHERE as_table.token = session_token 
      AND as_table.expires_at > now()
      AND au.is_active = true
    LIMIT 1;
    
    IF FOUND THEN
      RETURN user_record.id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;