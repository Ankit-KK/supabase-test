-- Create moderator role enum
CREATE TYPE public.moderator_role AS ENUM ('owner', 'moderator', 'viewer');

-- Add moderation_mode to streamers table (auto_approve or manual)
ALTER TABLE public.streamers 
ADD COLUMN IF NOT EXISTS moderation_mode text DEFAULT 'auto_approve' CHECK (moderation_mode IN ('auto_approve', 'manual'));

-- Update streamers_moderators table with role and permissions
ALTER TABLE public.streamers_moderators 
ADD COLUMN IF NOT EXISTS role moderator_role DEFAULT 'moderator',
ADD COLUMN IF NOT EXISTS can_approve boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_reject boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_hide_message boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_ban boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_replay boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_mods boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_action_at timestamptz,
ADD COLUMN IF NOT EXISTS total_actions integer DEFAULT 0;

-- Create moderation_actions audit log table
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid REFERENCES public.streamers(id) ON DELETE CASCADE NOT NULL,
  moderator_id uuid REFERENCES public.streamers_moderators(id) ON DELETE SET NULL,
  moderator_telegram_id text,
  moderator_name text,
  donation_id uuid NOT NULL,
  donation_table text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('approve', 'reject', 'hide_message', 'unhide_message', 'ban_donor', 'unban_donor', 'replay')),
  action_source text NOT NULL CHECK (action_source IN ('telegram', 'dashboard', 'system')),
  previous_status text,
  new_status text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create banned_donors table
CREATE TABLE IF NOT EXISTS public.banned_donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid REFERENCES public.streamers(id) ON DELETE CASCADE NOT NULL,
  donor_name text NOT NULL,
  donor_name_lower text GENERATED ALWAYS AS (lower(donor_name)) STORED,
  banned_by_moderator_id uuid REFERENCES public.streamers_moderators(id) ON DELETE SET NULL,
  banned_by_name text,
  reason text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_moderation_actions_streamer ON public.moderation_actions(streamer_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_donation ON public.moderation_actions(donation_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON public.moderation_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banned_donors_streamer ON public.banned_donors(streamer_id);
CREATE INDEX IF NOT EXISTS idx_banned_donors_name ON public.banned_donors(donor_name_lower) WHERE is_active = true;

-- Enable RLS on new tables
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_donors ENABLE ROW LEVEL SECURITY;

-- RLS policies for moderation_actions
CREATE POLICY "Service role can manage moderation actions"
ON public.moderation_actions FOR ALL
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');

CREATE POLICY "Streamers can view their moderation actions"
ON public.moderation_actions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.streamers s 
    WHERE s.id = moderation_actions.streamer_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Moderators can view actions for their assigned streamers"
ON public.moderation_actions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.streamers_moderators sm
    WHERE sm.streamer_id = moderation_actions.streamer_id
    AND sm.is_active = true
    AND sm.id = moderation_actions.moderator_id
  )
);

-- RLS policies for banned_donors
CREATE POLICY "Service role can manage banned donors"
ON public.banned_donors FOR ALL
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');

CREATE POLICY "Streamers can view their banned donors"
ON public.banned_donors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.streamers s 
    WHERE s.id = banned_donors.streamer_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Streamers can manage their banned donors"
ON public.banned_donors FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.streamers s 
    WHERE s.id = banned_donors.streamer_id 
    AND s.user_id = auth.uid()
  )
);

-- Function to check if a donor is banned
CREATE OR REPLACE FUNCTION public.is_donor_banned(p_streamer_id uuid, p_donor_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.banned_donors
    WHERE streamer_id = p_streamer_id
    AND donor_name_lower = lower(p_donor_name)
    AND is_active = true
  );
$$;

-- Function to check moderator permission
CREATE OR REPLACE FUNCTION public.check_moderator_permission(
  p_moderator_id uuid,
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mod_record RECORD;
BEGIN
  SELECT * INTO mod_record
  FROM public.streamers_moderators
  WHERE id = p_moderator_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Owner has all permissions
  IF mod_record.role = 'owner' THEN
    RETURN true;
  END IF;
  
  -- Viewer has no action permissions
  IF mod_record.role = 'viewer' THEN
    RETURN false;
  END IF;
  
  -- Check specific permission for moderator role
  CASE p_permission
    WHEN 'approve' THEN RETURN mod_record.can_approve;
    WHEN 'reject' THEN RETURN mod_record.can_reject;
    WHEN 'hide_message' THEN RETURN mod_record.can_hide_message;
    WHEN 'ban' THEN RETURN mod_record.can_ban;
    WHEN 'replay' THEN RETURN mod_record.can_replay;
    WHEN 'manage_mods' THEN RETURN mod_record.can_manage_mods;
    ELSE RETURN false;
  END CASE;
END;
$$;

-- Function to log moderation action and update stats
CREATE OR REPLACE FUNCTION public.log_moderation_action(
  p_streamer_id uuid,
  p_moderator_id uuid,
  p_moderator_telegram_id text,
  p_moderator_name text,
  p_donation_id uuid,
  p_donation_table text,
  p_action_type text,
  p_action_source text,
  p_previous_status text DEFAULT NULL,
  p_new_status text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_id uuid;
BEGIN
  -- Insert action log
  INSERT INTO public.moderation_actions (
    streamer_id, moderator_id, moderator_telegram_id, moderator_name,
    donation_id, donation_table, action_type, action_source,
    previous_status, new_status, notes
  ) VALUES (
    p_streamer_id, p_moderator_id, p_moderator_telegram_id, p_moderator_name,
    p_donation_id, p_donation_table, p_action_type, p_action_source,
    p_previous_status, p_new_status, p_notes
  ) RETURNING id INTO action_id;
  
  -- Update moderator stats
  IF p_moderator_id IS NOT NULL THEN
    UPDATE public.streamers_moderators
    SET last_action_at = now(),
        total_actions = COALESCE(total_actions, 0) + 1
    WHERE id = p_moderator_id;
  END IF;
  
  RETURN action_id;
END;
$$;