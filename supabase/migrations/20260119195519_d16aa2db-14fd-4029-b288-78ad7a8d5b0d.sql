-- =====================================================
-- FIX SERVICE ROLE RLS POLICIES FOR AUTH/MODERATOR TABLES
-- =====================================================

-- ============ AUTH_SESSIONS ============
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.auth_sessions;
DROP POLICY IF EXISTS "Service role can read all sessions" ON public.auth_sessions;

CREATE POLICY "Service role can manage all sessions"
ON public.auth_sessions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ STREAMERS_MODERATORS ============
DROP POLICY IF EXISTS "Service role can access all moderators" ON public.streamers_moderators;

CREATE POLICY "Service role can manage all moderators"
ON public.streamers_moderators FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ STREAMERS ============
DROP POLICY IF EXISTS "Service role can manage all streamers" ON public.streamers;

CREATE POLICY "Service role can manage all streamers"
ON public.streamers FOR ALL TO service_role
USING (true) WITH CHECK (true);