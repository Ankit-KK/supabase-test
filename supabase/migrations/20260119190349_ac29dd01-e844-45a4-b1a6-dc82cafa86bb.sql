-- =====================================================
-- FIX RLS POLICIES FOR ALL DONATION TABLES
-- =====================================================

-- ============ ABDEVIL_DONATIONS ============
GRANT SELECT ON public.abdevil_donations TO anon;
GRANT SELECT ON public.abdevil_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.abdevil_donations;
CREATE POLICY "Service role can manage all donations"
ON public.abdevil_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ ANKIT_DONATIONS ============
GRANT SELECT ON public.ankit_donations TO anon;
GRANT SELECT ON public.ankit_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.ankit_donations;
CREATE POLICY "Service role can manage all donations"
ON public.ankit_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ BONGFLICK_DONATIONS ============
GRANT SELECT ON public.bongflick_donations TO anon;
GRANT SELECT ON public.bongflick_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.bongflick_donations;
CREATE POLICY "Service role can manage all donations"
ON public.bongflick_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ CLUMSYGOD_DONATIONS ============
GRANT SELECT ON public.clumsygod_donations TO anon;
GRANT SELECT ON public.clumsygod_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.clumsygod_donations;
CREATE POLICY "Service role can manage all donations"
ON public.clumsygod_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ DAMASK_PLAYS_DONATIONS ============
GRANT SELECT ON public.damask_plays_donations TO anon;
GRANT SELECT ON public.damask_plays_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.damask_plays_donations;
CREATE POLICY "Service role can manage all donations"
ON public.damask_plays_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ JHANVOO_DONATIONS ============
GRANT SELECT ON public.jhanvoo_donations TO anon;
GRANT SELECT ON public.jhanvoo_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.jhanvoo_donations;
CREATE POLICY "Service role can manage all donations"
ON public.jhanvoo_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ JIMMY_GAMING_DONATIONS ============
GRANT SELECT ON public.jimmy_gaming_donations TO anon;
GRANT SELECT ON public.jimmy_gaming_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.jimmy_gaming_donations;
CREATE POLICY "Service role can manage all donations"
ON public.jimmy_gaming_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ MRIQMASTER_DONATIONS ============
GRANT SELECT ON public.mriqmaster_donations TO anon;
GRANT SELECT ON public.mriqmaster_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.mriqmaster_donations;
CREATE POLICY "Service role can manage all donations"
ON public.mriqmaster_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ NEKO_XENPAI_DONATIONS ============
GRANT SELECT ON public.neko_xenpai_donations TO anon;
GRANT SELECT ON public.neko_xenpai_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.neko_xenpai_donations;
CREATE POLICY "Service role can manage all donations"
ON public.neko_xenpai_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ NOTYOURKWEEN_DONATIONS ============
GRANT SELECT ON public.notyourkween_donations TO anon;
GRANT SELECT ON public.notyourkween_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.notyourkween_donations;
CREATE POLICY "Service role can manage all donations"
ON public.notyourkween_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ SAGARUJJWALGAMING_DONATIONS ============
GRANT SELECT ON public.sagarujjwalgaming_donations TO anon;
GRANT SELECT ON public.sagarujjwalgaming_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.sagarujjwalgaming_donations;
CREATE POLICY "Service role can manage all donations"
ON public.sagarujjwalgaming_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ SIZZORS_DONATIONS ============
GRANT SELECT ON public.sizzors_donations TO anon;
GRANT SELECT ON public.sizzors_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.sizzors_donations;
CREATE POLICY "Service role can manage all donations"
ON public.sizzors_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ THUNDERX_DONATIONS ============
GRANT SELECT ON public.thunderx_donations TO anon;
GRANT SELECT ON public.thunderx_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.thunderx_donations;
CREATE POLICY "Service role can manage all donations"
ON public.thunderx_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============ VIPBHAI_DONATIONS ============
GRANT SELECT ON public.vipbhai_donations TO anon;
GRANT SELECT ON public.vipbhai_donations TO authenticated;

DROP POLICY IF EXISTS "Service role can manage all donations" ON public.vipbhai_donations;
CREATE POLICY "Service role can manage all donations"
ON public.vipbhai_donations FOR ALL TO service_role
USING (true) WITH CHECK (true);