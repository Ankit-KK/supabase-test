-- Complete cleanup: Drop views, tables, unlink users, then delete streamers

-- Step 1: Drop the public views for removed streamers
DROP VIEW IF EXISTS abdevil_donations_public CASCADE;
DROP VIEW IF EXISTS bongflick_donations_public CASCADE;
DROP VIEW IF EXISTS clumsygod_donations_public CASCADE;
DROP VIEW IF EXISTS damask_plays_donations_public CASCADE;
DROP VIEW IF EXISTS jhanvoo_donations_public CASCADE;
DROP VIEW IF EXISTS jimmy_gaming_donations_public CASCADE;
DROP VIEW IF EXISTS mriqmaster_donations_public CASCADE;
DROP VIEW IF EXISTS neko_xenpai_donations_public CASCADE;
DROP VIEW IF EXISTS notyourkween_donations_public CASCADE;
DROP VIEW IF EXISTS sagarujjwalgaming_donations_public CASCADE;
DROP VIEW IF EXISTS sizzors_donations_public CASCADE;
DROP VIEW IF EXISTS thunderx_donations_public CASCADE;
DROP VIEW IF EXISTS vipbhai_donations_public CASCADE;

-- Step 2: Drop the donation tables (CASCADE handles any remaining dependencies)
DROP TABLE IF EXISTS abdevil_donations CASCADE;
DROP TABLE IF EXISTS bongflick_donations CASCADE;
DROP TABLE IF EXISTS clumsygod_donations CASCADE;
DROP TABLE IF EXISTS damask_plays_donations CASCADE;
DROP TABLE IF EXISTS jhanvoo_donations CASCADE;
DROP TABLE IF EXISTS jimmy_gaming_donations CASCADE;
DROP TABLE IF EXISTS mriqmaster_donations CASCADE;
DROP TABLE IF EXISTS neko_xenpai_donations CASCADE;
DROP TABLE IF EXISTS notyourkween_donations CASCADE;
DROP TABLE IF EXISTS sagarujjwalgaming_donations CASCADE;
DROP TABLE IF EXISTS sizzors_donations CASCADE;
DROP TABLE IF EXISTS thunderx_donations CASCADE;
DROP TABLE IF EXISTS vipbhai_donations CASCADE;

-- Step 3: Unlink auth_users from streamers being deleted
UPDATE auth_users 
SET streamer_id = NULL 
WHERE streamer_id IN (
    SELECT id FROM streamers 
    WHERE streamer_slug NOT IN ('ankit', 'looteriya_gaming', 'chiaa_gaming')
);

-- Step 4: Delete obs_tokens for removed streamers
DELETE FROM obs_tokens 
WHERE streamer_id IN (
    SELECT id FROM streamers 
    WHERE streamer_slug NOT IN ('ankit', 'looteriya_gaming', 'chiaa_gaming')
);

-- Step 5: Delete banned_donors for removed streamers
DELETE FROM banned_donors 
WHERE streamer_id IN (
    SELECT id FROM streamers 
    WHERE streamer_slug NOT IN ('ankit', 'looteriya_gaming', 'chiaa_gaming')
);

-- Step 6: Delete moderation_actions for removed streamers
DELETE FROM moderation_actions 
WHERE streamer_id IN (
    SELECT id FROM streamers 
    WHERE streamer_slug NOT IN ('ankit', 'looteriya_gaming', 'chiaa_gaming')
);

-- Step 7: Delete streamers_moderators for removed streamers
DELETE FROM streamers_moderators 
WHERE streamer_id IN (
    SELECT id FROM streamers 
    WHERE streamer_slug NOT IN ('ankit', 'looteriya_gaming', 'chiaa_gaming')
);

-- Step 8: Finally delete the streamer records
DELETE FROM streamers 
WHERE streamer_slug NOT IN ('ankit', 'looteriya_gaming', 'chiaa_gaming');