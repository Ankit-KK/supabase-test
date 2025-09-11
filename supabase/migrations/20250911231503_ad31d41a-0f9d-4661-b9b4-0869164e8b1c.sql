-- Fix streamers_auth_emails to properly reference streamers.id instead of user_id
-- and add helper functions for managing streamer emails

-- First, fix the existing data by updating streamer_id to reference streamers.id instead of user_id
UPDATE streamers_auth_emails 
SET streamer_id = (
  SELECT s.id 
  FROM streamers s 
  WHERE s.user_id = streamers_auth_emails.streamer_id
)
WHERE EXISTS (
  SELECT 1 FROM streamers s 
  WHERE s.user_id = streamers_auth_emails.streamer_id
);

-- Add proper foreign key constraint
ALTER TABLE streamers_auth_emails 
ADD CONSTRAINT streamers_auth_emails_streamer_id_fkey 
FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE;

-- Create a helper function to add authorized emails for a streamer
CREATE OR REPLACE FUNCTION public.add_streamer_auth_email(p_streamer_slug text, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_streamer_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Get streamer ID and verify ownership
  SELECT id INTO v_streamer_id
  FROM streamers 
  WHERE streamer_slug = p_streamer_slug
    AND (user_id = current_user_id OR public.is_admin_email(auth.email()));
  
  IF v_streamer_id IS NULL THEN
    RAISE EXCEPTION 'Streamer not found or access denied';
  END IF;
  
  -- Validate email format
  IF p_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Insert the email (ignore duplicates)
  INSERT INTO streamers_auth_emails (streamer_id, email)
  VALUES (v_streamer_id, lower(trim(p_email)))
  ON CONFLICT (streamer_id, email) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Create a helper function to remove authorized emails for a streamer
CREATE OR REPLACE FUNCTION public.remove_streamer_auth_email(p_streamer_slug text, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_streamer_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Get streamer ID and verify ownership
  SELECT id INTO v_streamer_id
  FROM streamers 
  WHERE streamer_slug = p_streamer_slug
    AND (user_id = current_user_id OR public.is_admin_email(auth.email()));
  
  IF v_streamer_id IS NULL THEN
    RAISE EXCEPTION 'Streamer not found or access denied';
  END IF;
  
  -- Remove the email
  DELETE FROM streamers_auth_emails
  WHERE streamer_id = v_streamer_id 
    AND lower(email) = lower(trim(p_email));
  
  RETURN true;
END;
$$;

-- Create a helper function to update/replace authorized emails for a streamer
CREATE OR REPLACE FUNCTION public.update_streamer_auth_email(p_streamer_slug text, p_old_email text, p_new_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_streamer_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Get streamer ID and verify ownership
  SELECT id INTO v_streamer_id
  FROM streamers 
  WHERE streamer_slug = p_streamer_slug
    AND (user_id = current_user_id OR public.is_admin_email(auth.email()));
  
  IF v_streamer_id IS NULL THEN
    RAISE EXCEPTION 'Streamer not found or access denied';
  END IF;
  
  -- Validate new email format
  IF p_new_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Update the email
  UPDATE streamers_auth_emails
  SET email = lower(trim(p_new_email)),
      created_at = now()
  WHERE streamer_id = v_streamer_id 
    AND lower(email) = lower(trim(p_old_email));
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Original email not found for this streamer';
  END IF;
  
  RETURN true;
END;
$$;

-- Add unique constraint to prevent duplicate emails per streamer
ALTER TABLE streamers_auth_emails 
ADD CONSTRAINT streamers_auth_emails_streamer_email_unique 
UNIQUE (streamer_id, email);