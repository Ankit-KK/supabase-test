-- Complete Database Function Cleanup and Recreation (Fixed)
-- Phase 1: Drop HTTP extension first, then all remaining functions

-- Drop HTTP extension (this will remove all http functions)
DROP EXTENSION IF EXISTS http CASCADE;

-- Drop all remaining custom functions systematically
DROP FUNCTION IF EXISTS public.auto_approve_newstreamer_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.check_username_exists(text) CASCADE;
DROP FUNCTION IF EXISTS public.check_username_exists(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_service_role() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_websocket_connections() CASCADE;
DROP FUNCTION IF EXISTS public.get_active_obs_token(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_demostreamer_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_visits_table() CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_ankit_hyperemotes_iu() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_profile(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.check_rate_limit(text, text, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_streamer_by_slug(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_streamer_by_obs_token(text) CASCADE;
DROP FUNCTION IF EXISTS public.is_current_user_admin() CASCADE;
DROP FUNCTION IF EXISTS public.authenticate_streamer(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_obs_token(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_streamer_by_obs_token_v2(text) CASCADE;
DROP FUNCTION IF EXISTS public.log_access_attempt(text, text, uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.regenerate_obs_token(uuid, text, timestamp with time zone) CASCADE;
DROP FUNCTION IF EXISTS public.log_security_event(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.get_visitor_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_page_visitor_stats(text) CASCADE;
DROP FUNCTION IF EXISTS public.log_sensitive_access(text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.validate_donation_amount(numeric) CASCADE;
DROP FUNCTION IF EXISTS public.is_valid_streamer_operation(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_admin_emails() CASCADE;
DROP FUNCTION IF EXISTS public.add_admin_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_public_streamer_info(text) CASCADE;
DROP FUNCTION IF EXISTS public.log_moderator_access() CASCADE;
DROP FUNCTION IF EXISTS public.verify_moderator_access(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.remove_admin_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.add_streamer_auth_email(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.safe_export_user_signups(text) CASCADE;
DROP FUNCTION IF EXISTS public.remove_streamer_auth_email(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_streamer_auth_email(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_streamer_moderator_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_moderators(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_donation_modification() CASCADE;
DROP FUNCTION IF EXISTS public.get_recent_donations_public(text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_alerts_for_obs_token(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_obs_token_secure(text) CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_ankit_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS public.create_streamer_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.log_obs_token_access() CASCADE;
DROP FUNCTION IF EXISTS public.log_auth_email_access() CASCADE;
DROP FUNCTION IF EXISTS public.link_streamer_to_current_user(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_streamer_public_settings(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_signups_secure(text) CASCADE;
DROP FUNCTION IF EXISTS public.hash_obs_token(text) CASCADE;
DROP FUNCTION IF EXISTS public.encrypt_obs_token(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_obs_token_secure_with_audit(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.check_and_rotate_expired_tokens() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_streamers(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_donation_insert(numeric, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_streamer_email_allowed(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.record_streamer_login(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_alerts_donations(text, text) CASCADE;

-- Phase 2: Recreate Essential Core Functions

-- 1. Security Functions
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IN (
    SELECT NULL::uuid WHERE FALSE  -- Restrictive by default
  );
$$;

CREATE OR REPLACE FUNCTION public.validate_donation_input(
  p_amount numeric,
  p_name text,
  p_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate amount
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    RETURN false;
  END IF;
  
  -- Validate name
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 OR LENGTH(p_name) > 100 THEN
    RETURN false;
  END IF;
  
  -- Validate message if provided
  IF p_message IS NOT NULL AND LENGTH(p_message) > 500 THEN
    RETURN false;
  END IF;
  
  -- Check for XSS attempts
  IF p_name ~* '<[^>]*>|javascript:|data:|vbscript:' OR 
     (p_message IS NOT NULL AND p_message ~* '<[^>]*>|javascript:|data:|vbscript:') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  event_details text DEFAULT NULL,
  ip_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple logging for now - can be enhanced later
  RAISE NOTICE 'Security Event: % - % from %', event_type, event_details, ip_address;
END;
$$;

-- 2. Streamer Management Functions
CREATE OR REPLACE FUNCTION public.get_streamer_by_slug(slug text)
RETURNS TABLE(
  id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  brand_logo_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    s.brand_logo_url
  FROM public.streamers s
  WHERE s.streamer_slug = slug
  LIMIT 1;
$$;

-- 3. OBS Token Functions
CREATE OR REPLACE FUNCTION public.generate_obs_token(p_streamer_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token text;
BEGIN
  -- Generate cryptographically secure token
  new_token := encode(gen_random_bytes(32), 'hex');
  
  -- Deactivate existing tokens
  UPDATE public.obs_tokens
  SET is_active = false
  WHERE streamer_id = p_streamer_id AND is_active = true;
  
  -- Insert new token
  INSERT INTO public.obs_tokens (streamer_id, token, is_active)
  VALUES (p_streamer_id, new_token, true);
  
  RETURN new_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_obs_token(token_to_check text)
RETURNS TABLE(
  streamer_id uuid,
  streamer_slug text,
  streamer_name text,
  brand_color text,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as streamer_id,
    s.streamer_slug,
    s.streamer_name,
    s.brand_color,
    true as is_valid
  FROM public.streamers s
  INNER JOIN public.obs_tokens ot ON s.id = ot.streamer_id
  WHERE ot.token = token_to_check 
    AND ot.is_active = true
    AND (ot.expires_at IS NULL OR ot.expires_at > now());
    
  -- If no valid token found, return invalid result
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::uuid as streamer_id,
      NULL::text as streamer_slug,
      NULL::text as streamer_name,
      NULL::text as brand_color,
      false as is_valid;
  END IF;
END;
$$;

-- 4. Auto-approval Triggers for Hyperemotes
CREATE OR REPLACE FUNCTION public.auto_approve_hyperemotes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-approve hyperemotes
  IF NEW.is_hyperemote = true THEN
    NEW.moderation_status = 'auto_approved';
    NEW.approved_by = 'system';
    NEW.approved_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;