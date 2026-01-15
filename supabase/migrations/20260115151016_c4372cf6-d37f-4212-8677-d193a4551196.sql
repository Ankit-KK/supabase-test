-- Enable Row Level Security on user_signups table
ALTER TABLE public.user_signups ENABLE ROW LEVEL SECURITY;

-- No policies needed - service role bypasses RLS by default
-- This means only server-side operations (edge functions with service role) can access the data
-- All client-side access will be blocked

-- Revoke any existing public access
REVOKE ALL ON public.user_signups FROM anon;
REVOKE ALL ON public.user_signups FROM authenticated;