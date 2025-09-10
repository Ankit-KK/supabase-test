-- Fix OBS token security issues step by step

-- First, update any tokens shorter than 32 characters
UPDATE public.obs_tokens 
SET token = CASE 
  WHEN token IS NULL OR char_length(token) < 32 THEN 
    encode(gen_random_bytes(32), 'hex')
  ELSE token 
END
WHERE token IS NULL OR char_length(token) < 32;

-- Add security columns
ALTER TABLE public.obs_tokens 
ADD COLUMN IF NOT EXISTS token_encrypted text,
ADD COLUMN IF NOT EXISTS token_hash text, 
ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rotation_due_at timestamp with time zone DEFAULT (now() + interval '30 days');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_obs_tokens_hash ON public.obs_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_obs_tokens_rotation ON public.obs_tokens(rotation_due_at) WHERE is_active = true;

-- Create audit table
CREATE TABLE IF NOT EXISTS public.obs_token_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.obs_tokens(id) ON DELETE CASCADE,
  streamer_id uuid REFERENCES public.streamers(id) ON DELETE CASCADE,
  access_ip inet,
  user_agent text,
  access_timestamp timestamp with time zone DEFAULT now(),
  access_type text DEFAULT 'validation',
  success boolean DEFAULT true
);

-- Enable RLS on audit table
ALTER TABLE public.obs_token_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit table
CREATE POLICY "Streamers view own token audit" ON public.obs_token_audit FOR SELECT
  USING (streamer_id IN (SELECT s.id FROM public.streamers s WHERE s.user_id = auth.uid()));

CREATE POLICY "Admins view all token audit" ON public.obs_token_audit FOR SELECT
  USING (public.is_admin_email(auth.email()));

CREATE POLICY "System insert audit logs" ON public.obs_token_audit FOR INSERT
  WITH CHECK (true);

-- Security functions
CREATE OR REPLACE FUNCTION public.hash_obs_token(token_text text)
RETURNS text AS $$
BEGIN
  RETURN encode(digest(token_text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.encrypt_obs_token(token_text text)
RETURNS text AS $$
DECLARE
  salt text;
  encrypted_token text;
BEGIN
  salt := encode(gen_random_bytes(16), 'hex');
  encrypted_token := encode(digest(salt || token_text || salt, 'sha512'), 'base64');
  RETURN salt || ':' || encrypted_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced token validation with audit logging
CREATE OR REPLACE FUNCTION public.validate_obs_token_secure_with_audit(
  token_to_check text, 
  client_ip text DEFAULT NULL, 
  client_user_agent text DEFAULT NULL
)
RETURNS TABLE(
  streamer_id uuid, streamer_slug text, streamer_name text, 
  brand_color text, brand_logo_url text, is_valid boolean
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Token rotation function
CREATE OR REPLACE FUNCTION public.check_and_rotate_expired_tokens()
RETURNS void AS $$
BEGIN
  UPDATE public.obs_tokens 
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND rotation_due_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Populate security fields for existing tokens
UPDATE public.obs_tokens 
SET 
  token_hash = public.hash_obs_token(token),
  token_encrypted = public.encrypt_obs_token(token),
  rotation_due_at = COALESCE(rotation_due_at, created_at + interval '30 days')
WHERE token_hash IS NULL AND token IS NOT NULL;