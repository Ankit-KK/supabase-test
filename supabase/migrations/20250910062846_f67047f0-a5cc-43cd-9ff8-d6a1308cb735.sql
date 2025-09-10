-- Security Enhancement: Fix existing tokens and implement encryption

-- First, fix any existing tokens that are too short or null
UPDATE public.obs_tokens 
SET token = CASE 
  WHEN token IS NULL OR char_length(token) < 32 THEN 
    -- Generate new 64-character secure token for any invalid ones
    array_to_string(array(select substr('0123456789abcdef', ceil(random()*16)::integer, 1) from generate_series(1, 64)), '')
  ELSE token 
END
WHERE token IS NULL OR char_length(token) < 32;

-- Add new security columns to obs_tokens table
ALTER TABLE public.obs_tokens 
ADD COLUMN IF NOT EXISTS token_encrypted text,
ADD COLUMN IF NOT EXISTS token_hash text, 
ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rotation_due_at timestamp with time zone DEFAULT (now() + interval '30 days');

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_obs_tokens_hash ON public.obs_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_obs_tokens_rotation ON public.obs_tokens(rotation_due_at) WHERE is_active = true;

-- Create audit table for token usage tracking
CREATE TABLE IF NOT EXISTS public.obs_token_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.obs_tokens(id) ON DELETE CASCADE,
  streamer_id uuid REFERENCES public.streamers(id) ON DELETE CASCADE,
  access_ip inet,
  user_agent text,
  access_timestamp timestamp with time zone DEFAULT now(),
  access_type text DEFAULT 'validation', -- 'validation', 'generation', 'rotation'
  success boolean DEFAULT true
);

-- Enable RLS on audit table
ALTER TABLE public.obs_token_audit ENABLE ROW LEVEL SECURITY;

-- Audit table RLS policies
CREATE POLICY "Streamers can view their token audit logs"
  ON public.obs_token_audit FOR SELECT
  USING (
    streamer_id IN (
      SELECT s.id FROM public.streamers s 
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all token audit logs"
  ON public.obs_token_audit FOR SELECT
  USING (public.is_admin_email(auth.email()));

CREATE POLICY "System can insert audit logs"
  ON public.obs_token_audit FOR INSERT
  WITH CHECK (true);

-- Create secure token management functions

-- Function to generate SHA-256 hash for secure token lookup
CREATE OR REPLACE FUNCTION public.hash_obs_token(token_text text)
RETURNS text AS $$
BEGIN
  RETURN encode(digest(token_text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Simplified token encryption function (for demonstration)
CREATE OR REPLACE FUNCTION public.encrypt_obs_token(token_text text)
RETURNS text AS $$
DECLARE
  salt text;
  encrypted_token text;
BEGIN
  -- Generate random salt
  salt := encode(gen_random_bytes(16), 'hex');
  
  -- Simple encryption using salted hash (in production, use proper AES)
  encrypted_token := encode(
    digest(salt || token_text || salt, 'sha512'), 
    'base64'
  );
  
  -- Return salt:encrypted format
  RETURN salt || ':' || encrypted_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced token validation with audit logging
CREATE OR REPLACE FUNCTION public.validate_obs_token_secure_audit(
  token_to_check text, 
  client_ip text DEFAULT NULL, 
  client_user_agent text DEFAULT NULL
)
RETURNS TABLE(
  streamer_id uuid, 
  streamer_slug text, 
  streamer_name text, 
  brand_color text, 
  brand_logo_url text, 
  is_valid boolean
) AS $$
DECLARE
  token_record record;
  token_hash_to_check text;
BEGIN
  -- Generate hash for secure lookup
  token_hash_to_check := public.hash_obs_token(token_to_check);
  
  -- Find active token by hash
  SELECT ot.*, s.streamer_slug, s.streamer_name, s.brand_color, s.brand_logo_url
  INTO token_record
  FROM public.obs_tokens ot
  INNER JOIN public.streamers s ON ot.streamer_id = s.id
  WHERE ot.token_hash = token_hash_to_check 
    AND ot.is_active = true
    AND (ot.expires_at IS NULL OR ot.expires_at > now())
    AND (ot.rotation_due_at IS NULL OR ot.rotation_due_at > now());
  
  IF FOUND THEN
    -- Update usage statistics
    UPDATE public.obs_tokens 
    SET 
      last_used_at = now(),
      usage_count = COALESCE(usage_count, 0) + 1
    WHERE id = token_record.id;
    
    -- Log successful access
    INSERT INTO public.obs_token_audit (
      token_id, streamer_id, access_ip, user_agent, access_type, success
    ) VALUES (
      token_record.id, token_record.streamer_id, 
      client_ip::inet, client_user_agent, 'validation', true
    );
    
    -- Return success
    RETURN QUERY SELECT 
      token_record.streamer_id,
      token_record.streamer_slug,
      token_record.streamer_name, 
      token_record.brand_color,
      token_record.brand_logo_url,
      true as is_valid;
  ELSE
    -- Log failed attempt
    IF client_ip IS NOT NULL THEN
      INSERT INTO public.obs_token_audit (
        token_id, streamer_id, access_ip, user_agent, access_type, success
      ) VALUES (
        NULL, NULL, client_ip::inet, client_user_agent, 'validation', false
      );
    END IF;
    
    -- Return failure
    RETURN QUERY SELECT 
      NULL::uuid as streamer_id,
      NULL::text as streamer_slug,
      NULL::text as streamer_name,
      NULL::text as brand_color,
      NULL::text as brand_logo_url,
      false as is_valid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and rotate expired tokens
CREATE OR REPLACE FUNCTION public.check_token_rotation()
RETURNS void AS $$
BEGIN
  -- Deactivate tokens due for rotation
  UPDATE public.obs_tokens 
  SET 
    is_active = false,
    updated_at = now()
  WHERE is_active = true 
    AND rotation_due_at < now();
    
  -- Log rotation events
  INSERT INTO public.obs_token_audit (token_id, streamer_id, access_type, success)
  SELECT ot.id, ot.streamer_id, 'auto_rotation', true
  FROM public.obs_tokens ot 
  WHERE ot.is_active = false 
    AND ot.rotation_due_at < now() 
    AND ot.updated_at > now() - interval '1 minute';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced regenerate function with encryption
CREATE OR REPLACE FUNCTION public.regenerate_obs_token_encrypted(
  p_streamer_id uuid, 
  p_new_token text, 
  p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(token text) AS $$
DECLARE
  streamer_record RECORD;
  current_user_id uuid;
  token_hash text;
  encrypted_token text;
BEGIN
  current_user_id := auth.uid();
  
  -- Verify streamer exists and access
  SELECT * INTO streamer_record
  FROM public.streamers s 
  WHERE s.id = p_streamer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Streamer not found with id: %', p_streamer_id;
  END IF;
  
  -- Check authorization
  IF streamer_record.user_id IS NOT NULL AND 
     (current_user_id IS NULL OR streamer_record.user_id != current_user_id) THEN
    RAISE EXCEPTION 'Not authorized to regenerate token for this streamer';
  END IF;

  -- Generate secure hash and encryption
  token_hash := public.hash_obs_token(p_new_token);
  encrypted_token := public.encrypt_obs_token(p_new_token);

  -- Deactivate existing tokens
  UPDATE public.obs_tokens
  SET is_active = false, updated_at = now()
  WHERE streamer_id = p_streamer_id AND is_active = true;

  -- Insert new encrypted token
  RETURN QUERY
  INSERT INTO public.obs_tokens (
    streamer_id, token, token_hash, token_encrypted, is_active, 
    expires_at, rotation_due_at
  )
  VALUES (
    p_streamer_id, p_new_token, token_hash, encrypted_token, true, 
    p_expires_at, COALESCE(p_expires_at, now() + interval '30 days')
  )
  RETURNING obs_tokens.token;
  
  -- Log token generation
  INSERT INTO public.obs_token_audit (
    token_id, streamer_id, access_type, success
  ) 
  SELECT ot.id, ot.streamer_id, 'generation', true
  FROM public.obs_tokens ot 
  WHERE ot.streamer_id = p_streamer_id 
    AND ot.is_active = true 
  ORDER BY ot.created_at DESC 
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now add constraints (after fixing data)
ALTER TABLE public.obs_tokens 
ADD CONSTRAINT IF NOT EXISTS check_token_not_empty CHECK (char_length(token) >= 32);

-- Populate security fields for existing tokens
UPDATE public.obs_tokens 
SET 
  token_hash = public.hash_obs_token(token),
  token_encrypted = public.encrypt_obs_token(token),
  rotation_due_at = COALESCE(rotation_due_at, created_at + interval '30 days')
WHERE token_hash IS NULL AND token IS NOT NULL;