
-- 1. Add discord_moderation_enabled to streamers
ALTER TABLE public.streamers ADD COLUMN discord_moderation_enabled boolean DEFAULT false;

-- 2. Add discord_user_id to streamers_moderators
ALTER TABLE public.streamers_moderators ADD COLUMN discord_user_id text;

-- 3. Create discord_callback_mapping table
CREATE TABLE public.discord_callback_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id text UNIQUE NOT NULL,
  donation_id uuid NOT NULL,
  table_name text NOT NULL,
  streamer_id uuid NOT NULL REFERENCES public.streamers(id),
  action_type text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.discord_callback_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage discord callbacks"
ON public.discord_callback_mapping
FOR ALL
USING (current_setting('role'::text, true) = 'service_role'::text)
WITH CHECK (current_setting('role'::text, true) = 'service_role'::text);
