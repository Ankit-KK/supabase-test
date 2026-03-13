
-- ============================================================
-- Lock Down Donation Tables: Remove all public SELECT policies
-- ============================================================

-- 1. Drop public SELECT policies on all donation tables

-- ankit_donations
DROP POLICY IF EXISTS "Anyone can view approved donations" ON ankit_donations;

-- chiaa_gaming_donations
DROP POLICY IF EXISTS "Anyone can view approved donations" ON chiaa_gaming_donations;

-- looteriya_gaming_donations
DROP POLICY IF EXISTS "Anyone can view approved donations" ON looteriya_gaming_donations;

-- wolfy_donations
DROP POLICY IF EXISTS "Anyone can view approved wolfy donations" ON wolfy_donations;

-- brigzard_donations
DROP POLICY IF EXISTS "Anyone can view approved brigzard donations" ON brigzard_donations;

-- mr_champion_donations
DROP POLICY IF EXISTS "Anyone can view approved mr_champion donations" ON mr_champion_donations;

-- clumsy_god_donations (check if exists)
DROP POLICY IF EXISTS "Anyone can view approved clumsy_god donations" ON clumsy_god_donations;
DROP POLICY IF EXISTS "Anyone can view approved donations" ON clumsy_god_donations;

-- dorp_plays_donations
DROP POLICY IF EXISTS "Anyone can view approved dorp_plays donations" ON dorp_plays_donations;
DROP POLICY IF EXISTS "Anyone can view approved donations" ON dorp_plays_donations;

-- zishu_donations
DROP POLICY IF EXISTS "Anyone can view approved zishu donations" ON zishu_donations;
DROP POLICY IF EXISTS "Anyone can view approved donations" ON zishu_donations;

-- w_era_donations
DROP POLICY IF EXISTS "Anyone can view approved w_era donations" ON w_era_donations;
DROP POLICY IF EXISTS "Anyone can view approved donations" ON w_era_donations;

-- demigod_donations
DROP POLICY IF EXISTS "Anyone can view approved demigod donations" ON demigod_donations;
DROP POLICY IF EXISTS "Anyone can view approved donations" ON demigod_donations;

-- nova_plays_donations
DROP POLICY IF EXISTS "Anyone can view approved nova_plays donations" ON nova_plays_donations;

-- starlight_anya_donations
DROP POLICY IF EXISTS "Anyone can view approved starlight_anya donations" ON starlight_anya_donations;

-- reyna_yadav_donations
DROP POLICY IF EXISTS "Anyone can view approved reyna_yadav donations" ON reyna_yadav_donations;

-- 2. Drop unused _donations_public views
DROP VIEW IF EXISTS ankit_donations_public;
DROP VIEW IF EXISTS brigzard_donations_public;
DROP VIEW IF EXISTS chiaa_gaming_donations_public;
DROP VIEW IF EXISTS clumsy_god_donations_public;
DROP VIEW IF EXISTS demigod_donations_public;
DROP VIEW IF EXISTS dorp_plays_donations_public;
DROP VIEW IF EXISTS looteriya_gaming_donations_public;
DROP VIEW IF EXISTS nova_plays_donations_public;
DROP VIEW IF EXISTS reyna_yadav_donations_public;
DROP VIEW IF EXISTS starlight_anya_donations_public;
DROP VIEW IF EXISTS zishu_donations_public;

-- 3. Revoke SELECT on streamer_donator_totals from anon/authenticated
REVOKE SELECT ON streamer_donator_totals FROM anon;
REVOKE SELECT ON streamer_donator_totals FROM authenticated;

-- Drop any existing public SELECT policy on streamer_donator_totals
DROP POLICY IF EXISTS "Anyone can view donator totals" ON streamer_donator_totals;
DROP POLICY IF EXISTS "Public can view donator totals" ON streamer_donator_totals;
DROP POLICY IF EXISTS "Allow public read access" ON streamer_donator_totals;
