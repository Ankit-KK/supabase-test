-- Update the auto-approve function to respect moderation_mode setting
CREATE OR REPLACE FUNCTION public.auto_approve_ankit_hyperemotes_iu()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  streamer_moderation_mode text;
BEGIN
  -- Get the streamer's moderation mode
  SELECT moderation_mode INTO streamer_moderation_mode
  FROM public.streamers
  WHERE id = NEW.streamer_id;
  
  -- Only auto-approve if moderation_mode is 'auto_approve' (or null for backwards compatibility)
  IF COALESCE(streamer_moderation_mode, 'auto_approve') = 'auto_approve' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.moderation_status IS NULL OR NEW.moderation_status = 'pending' THEN
        NEW.moderation_status := 'auto_approved';
        NEW.approved_by := 'system';
        NEW.approved_at := now();
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF COALESCE(OLD.moderation_status, 'pending') = 'pending' THEN
        NEW.moderation_status := 'auto_approved';
        NEW.approved_by := 'system';
        NEW.approved_at := now();
      END IF;
    END IF;
  ELSE
    -- Manual moderation mode: leave status as 'pending'
    IF TG_OP = 'INSERT' THEN
      IF NEW.moderation_status IS NULL THEN
        NEW.moderation_status := 'pending';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;