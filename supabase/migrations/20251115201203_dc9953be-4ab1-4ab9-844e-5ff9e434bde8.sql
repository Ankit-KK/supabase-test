-- Add Neko XENPAI user to auth_users table
-- First, get the streamer_id for neko_xenpai
DO $$
DECLARE
  v_streamer_id uuid;
  v_user_id uuid;
BEGIN
  -- Get or create the neko_xenpai streamer record
  SELECT id INTO v_streamer_id
  FROM streamers
  WHERE streamer_slug = 'neko_xenpai';

  -- If streamer doesn't exist, create it
  IF v_streamer_id IS NULL THEN
    INSERT INTO streamers (streamer_slug, streamer_name, brand_color, hyperemotes_enabled, hyperemotes_min_amount, pusher_group)
    VALUES ('neko_xenpai', 'Neko XENPAI', '#d946ef', true, 1, 1)
    RETURNING id INTO v_streamer_id;
  END IF;

  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth_users
  WHERE email = 'neko@xenpai.com';

  -- If user doesn't exist, create it
  IF v_user_id IS NULL THEN
    INSERT INTO auth_users (email, password_hash, username, role, streamer_id, is_active)
    VALUES ('neko@xenpai.com', 'neko123', 'neko_xenpai', 'streamer', v_streamer_id, true)
    RETURNING id INTO v_user_id;
    
    -- Update streamers table with user_id
    UPDATE streamers 
    SET user_id = v_user_id
    WHERE id = v_streamer_id;
    
    RAISE NOTICE 'Created user for Neko XENPAI with email: neko@xenpai.com and password: neko123';
  ELSE
    -- Update existing user to link to streamer
    UPDATE auth_users 
    SET streamer_id = v_streamer_id
    WHERE id = v_user_id;
    
    -- Update streamers table with user_id
    UPDATE streamers 
    SET user_id = v_user_id
    WHERE id = v_streamer_id;
    
    RAISE NOTICE 'Updated existing user for Neko XENPAI';
  END IF;
END $$;