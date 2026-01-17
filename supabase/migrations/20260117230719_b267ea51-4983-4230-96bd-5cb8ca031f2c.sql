-- Fix SECURITY DEFINER functions by adding SET search_path = public
-- This prevents search_path manipulation attacks

-- 1. check_and_rotate_expired_tokens
CREATE OR REPLACE FUNCTION public.check_and_rotate_expired_tokens()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  UPDATE public.obs_tokens 
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND rotation_due_at < now();
END;
$function$;

-- 2. cleanup_expired_callback_mappings
CREATE OR REPLACE FUNCTION public.cleanup_expired_callback_mappings()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.telegram_callback_mapping WHERE expires_at < NOW();
END;
$function$;

-- 3. cleanup_expired_websocket_connections
CREATE OR REPLACE FUNCTION public.cleanup_expired_websocket_connections()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.active_websocket_connections 
  WHERE expires_at < now();
END;
$function$;

-- 4. encrypt_obs_token
CREATE OR REPLACE FUNCTION public.encrypt_obs_token(token_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  salt text;
  encrypted_token text;
BEGIN
  salt := encode(gen_random_bytes(16), 'hex');
  encrypted_token := encode(digest(salt || token_text || salt, 'sha512'), 'base64');
  RETURN salt || ':' || encrypted_token;
END;
$function$;

-- 5. get_signup_secure
CREATE OR REPLACE FUNCTION public.get_signup_secure(signup_id uuid, access_reason text)
 RETURNS TABLE(id uuid, name text, email text, mobile_number text, youtube_channel text, instagram_handle text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Verify admin access
  IF NOT public.verify_admin_with_audit(access_reason) THEN
    RAISE EXCEPTION 'Access denied: Invalid admin credentials';
  END IF;
  
  -- Require meaningful reason
  IF access_reason IS NULL OR length(trim(access_reason)) < 10 THEN
    RAISE EXCEPTION 'Access denied: Detailed reason (min 10 chars) required';
  END IF;
  
  -- Return the record
  RETURN QUERY
  SELECT us.id, us.name, us.email, us.mobile_number,
         us.youtube_channel, us.instagram_handle, us.created_at
  FROM public.user_signups us
  WHERE us.id = signup_id;
END;
$function$;

-- 6. hash_obs_token
CREATE OR REPLACE FUNCTION public.hash_obs_token(token_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN encode(digest(token_text, 'sha256'), 'hex');
END;
$function$;

-- 7. validate_obs_token_secure_with_audit
CREATE OR REPLACE FUNCTION public.validate_obs_token_secure_with_audit(token_to_check text, client_ip text DEFAULT NULL::text, client_user_agent text DEFAULT NULL::text)
 RETURNS TABLE(streamer_id uuid, streamer_slug text, streamer_name text, brand_color text, brand_logo_url text, is_valid boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  token_record record;
  token_hash_to_check text;
BEGIN
  token_hash_to_check := public.hash_obs_token(token_to_check);
  
  SELECT ot.*, s.streamer_slug, s.streamer_name, s.brand_color, s.brand_logo_url
  INTO token_record
  FROM public.obs_tokens ot
  INNER JOIN public.streamers s ON ot.streamer_id = s.id
  WHERE ot.token_hash = token_hash_to_check 
    AND ot.is_active = true
    AND (ot.expires_at IS NULL OR ot.expires_at > now())
    AND (ot.rotation_due_at IS NULL OR ot.rotation_due_at > now());
  
  IF FOUND THEN
    UPDATE public.obs_tokens 
    SET last_used_at = now(), usage_count = COALESCE(usage_count, 0) + 1
    WHERE id = token_record.id;
    
    INSERT INTO public.obs_token_audit (
      token_id, streamer_id, access_ip, user_agent, access_type, success
    ) VALUES (
      token_record.id, token_record.streamer_id, 
      client_ip::inet, client_user_agent, 'validation', true
    );
    
    RETURN QUERY SELECT 
      token_record.streamer_id, token_record.streamer_slug, token_record.streamer_name, 
      token_record.brand_color, token_record.brand_logo_url, true as is_valid;
  ELSE
    IF client_ip IS NOT NULL THEN
      INSERT INTO public.obs_token_audit (
        token_id, streamer_id, access_ip, user_agent, access_type, success
      ) VALUES (NULL, NULL, client_ip::inet, client_user_agent, 'validation', false);
    END IF;
    
    RETURN QUERY SELECT 
      NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, false as is_valid;
  END IF;
END;
$function$;

-- 8. verify_admin_with_audit
CREATE OR REPLACE FUNCTION public.verify_admin_with_audit(access_reason text DEFAULT 'Admin access'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_email text;
  is_valid boolean := false;
BEGIN
  current_email := auth.email();
  is_valid := public.is_admin_email(current_email);
  
  -- Log access attempt
  BEGIN
    INSERT INTO public.sensitive_data_access_log (
      table_name,
      access_type,
      accessed_by,
      access_reason,
      ip_address
    ) VALUES (
      'user_signups',
      CASE WHEN is_valid THEN 'AUTHORIZED' ELSE 'UNAUTHORIZED' END,
      current_email,
      access_reason,
      inet_client_addr()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Continue if logging fails
      NULL;
  END;
  
  RETURN is_valid;
END;
$function$;