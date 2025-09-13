-- Fix ambiguous column references in RPC functions by properly qualifying column names

-- Drop and recreate get_streamer_donations function with proper column qualification
DROP FUNCTION IF EXISTS public.get_streamer_donations(uuid);

CREATE OR REPLACE FUNCTION public.get_streamer_donations(p_streamer_id uuid)
RETURNS TABLE(
  id uuid,
  name text, 
  amount numeric,
  message text,
  payment_status text,
  moderation_status text,
  created_at timestamp with time zone,
  is_hyperemote boolean,
  voice_message_url text,
  message_visible boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.amount,
    d.message,
    d.payment_status,
    d.moderation_status,
    d.created_at,
    d.is_hyperemote,
    d.voice_message_url,
    d.message_visible
  FROM (
    -- Ankit donations
    SELECT 
      a.id,
      a.name,
      a.amount,
      a.message,
      a.payment_status,
      a.moderation_status,
      a.created_at,
      a.is_hyperemote,
      a.voice_message_url,
      a.message_visible
    FROM public.ankit_donations a
    WHERE a.streamer_id = p_streamer_id
    
    UNION ALL
    
    -- Chia Gaming donations
    SELECT 
      c.id,
      c.name,
      c.amount,
      c.message,
      c.payment_status,
      c.moderation_status,
      c.created_at,
      c.is_hyperemote,
      c.voice_message_url,
      c.message_visible
    FROM public.chia_gaming_donations c
    WHERE c.streamer_id = p_streamer_id
    
    UNION ALL
    
    -- Demo Streamer donations
    SELECT 
      ds.id,
      ds.name,
      ds.amount,
      ds.message,
      ds.payment_status,
      ds.moderation_status,
      ds.created_at,
      ds.is_hyperemote,
      ds.voice_message_url,
      ds.message_visible
    FROM public.demostreamer_donations ds
    WHERE ds.streamer_id = p_streamer_id
  ) d
  ORDER BY d.created_at DESC
  LIMIT 100;
END;
$$;

-- Drop and recreate get_streamer_moderation_donations function with proper column qualification
DROP FUNCTION IF EXISTS public.get_streamer_moderation_donations(uuid);

CREATE OR REPLACE FUNCTION public.get_streamer_moderation_donations(p_streamer_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  amount numeric,
  message text,
  payment_status text,
  moderation_status text,
  created_at timestamp with time zone,
  is_hyperemote boolean,
  voice_message_url text,
  message_visible boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.amount,
    d.message,
    d.payment_status,
    d.moderation_status,
    d.created_at,
    d.is_hyperemote,
    d.voice_message_url,
    d.message_visible
  FROM (
    -- Ankit donations needing moderation
    SELECT 
      a.id,
      a.name,
      a.amount,
      a.message,
      a.payment_status,
      a.moderation_status,
      a.created_at,
      a.is_hyperemote,
      a.voice_message_url,
      a.message_visible
    FROM public.ankit_donations a
    WHERE a.streamer_id = p_streamer_id
      AND a.payment_status = 'success'
      AND a.moderation_status = 'pending'
      AND COALESCE(a.is_hyperemote, false) = false
    
    UNION ALL
    
    -- Chia Gaming donations needing moderation
    SELECT 
      c.id,
      c.name,
      c.amount,
      c.message,
      c.payment_status,
      c.moderation_status,
      c.created_at,
      c.is_hyperemote,
      c.voice_message_url,
      c.message_visible
    FROM public.chia_gaming_donations c
    WHERE c.streamer_id = p_streamer_id
      AND c.payment_status = 'success'
      AND c.moderation_status = 'pending'
      AND COALESCE(c.is_hyperemote, false) = false
    
    UNION ALL
    
    -- Demo Streamer donations needing moderation
    SELECT 
      ds.id,
      ds.name,
      ds.amount,
      ds.message,
      ds.payment_status,
      ds.moderation_status,
      ds.created_at,
      ds.is_hyperemote,
      ds.voice_message_url,
      ds.message_visible
    FROM public.demostreamer_donations ds
    WHERE ds.streamer_id = p_streamer_id
      AND ds.payment_status = 'success'
      AND ds.moderation_status = 'pending'
      AND COALESCE(ds.is_hyperemote, false) = false
  ) d
  ORDER BY d.created_at DESC
  LIMIT 50;
END;
$$;