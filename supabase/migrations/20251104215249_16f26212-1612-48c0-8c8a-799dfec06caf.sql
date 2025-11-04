-- Create auth_users records for Streamer17-46
DO $$
DECLARE
  v_user_id uuid;
  v_streamer_num int;
BEGIN
  -- Loop through streamers 17 to 46
  FOR v_streamer_num IN 17..46 LOOP
    -- Insert auth_users record and get the generated user_id
    INSERT INTO public.auth_users (
      email,
      password_hash,
      username,
      role,
      is_active
    ) VALUES (
      'streamer' || v_streamer_num || '@hyperchat.com',
      'Streamer123!',
      'streamer' || v_streamer_num,
      'user',
      true
    )
    RETURNING id INTO v_user_id;
    
    -- Update the corresponding streamer record with the user_id
    UPDATE public.streamers
    SET user_id = v_user_id,
        updated_at = now()
    WHERE streamer_slug = 'streamer' || v_streamer_num;
    
    RAISE NOTICE 'Created auth_users and linked streamer%', v_streamer_num;
  END LOOP;
END $$;