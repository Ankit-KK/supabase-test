-- Create function to update donation visibility for streamers

CREATE OR REPLACE FUNCTION public.update_donation_visibility(
  p_donation_id uuid, 
  p_streamer_id uuid, 
  p_new_visibility boolean, 
  p_table_name text DEFAULT 'demostreamer_donations'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify that the current user owns this streamer or is an admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.streamers s
      WHERE s.id = p_streamer_id AND s.user_id = auth.uid()
    ) OR 
    public.is_admin_email(auth.email())
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only update your own streamer donations';
  END IF;

  -- Update visibility based on table name
  IF p_table_name = 'ankit_donations' THEN
    UPDATE public.ankit_donations 
    SET message_visible = p_new_visibility
    WHERE id = p_donation_id AND streamer_id = p_streamer_id;
  ELSIF p_table_name = 'chia_gaming_donations' THEN
    UPDATE public.chia_gaming_donations 
    SET message_visible = p_new_visibility
    WHERE id = p_donation_id AND streamer_id = p_streamer_id;
  ELSE
    UPDATE public.demostreamer_donations 
    SET message_visible = p_new_visibility
    WHERE id = p_donation_id AND streamer_id = p_streamer_id;
  END IF;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation not found or access denied';
  END IF;
END;
$function$;