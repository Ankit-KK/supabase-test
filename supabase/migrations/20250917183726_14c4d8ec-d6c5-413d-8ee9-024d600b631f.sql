-- Add username and password_hash to streamers table
ALTER TABLE public.streamers 
ADD COLUMN username TEXT,
ADD COLUMN password_hash TEXT;

-- Add unique constraint on username
ALTER TABLE public.streamers 
ADD CONSTRAINT streamers_username_unique UNIQUE (username);

-- Insert default credentials for Ankit streamer (password: "ankit123")
UPDATE public.streamers 
SET username = 'ankit', 
    password_hash = '$2b$10$rQv.Zb3zF8xJ9mK2nL4pO.3zQ5rY7sT9uV1wX3yZ5aB7cD9eF1gH3'
WHERE streamer_slug = 'ankit';

-- Create authentication function
CREATE OR REPLACE FUNCTION public.authenticate_streamer_simple(p_username text, p_password text)
RETURNS TABLE(
  id uuid, 
  streamer_slug text, 
  streamer_name text, 
  brand_color text, 
  success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    true as success
  FROM public.streamers s
  WHERE s.username = p_username 
    AND s.password_hash = crypt(p_password, s.password_hash);
    
  -- If no rows returned, return a failure record
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::uuid,
      NULL::text,
      NULL::text,
      NULL::text,
      false as success;
  END IF;
END;
$$;