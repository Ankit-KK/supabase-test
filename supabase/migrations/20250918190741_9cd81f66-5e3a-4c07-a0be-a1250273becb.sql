-- Drop all database functions and tables to clean up the project (fixed)

-- Drop all triggers first
DROP TRIGGER IF EXISTS auto_approve_ankit_hyperemotes ON ankit_donations;
DROP TRIGGER IF EXISTS auto_approve_demostreamer_hyperemotes ON demostreamer_donations;
DROP TRIGGER IF EXISTS auto_approve_hyperemotes ON chia_gaming_donations;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS log_moderator_access_trigger ON streamers_moderators;
DROP TRIGGER IF EXISTS log_donation_modification_trigger ON ankit_donations;
DROP TRIGGER IF EXISTS log_donation_modification_trigger ON chia_gaming_donations;
DROP TRIGGER IF EXISTS log_donation_modification_trigger ON demostreamer_donations;
DROP TRIGGER IF EXISTS log_obs_token_access_trigger ON obs_tokens;
DROP TRIGGER IF EXISTS log_auth_email_access_trigger ON streamers_auth_emails;
DROP TRIGGER IF EXISTS update_updated_at_trigger ON streamers;

-- Drop all donation tables
DROP TABLE IF EXISTS ankit_donations CASCADE;
DROP TABLE IF EXISTS artcreate_donations CASCADE;
DROP TABLE IF EXISTS chia_gaming_donations CASCADE;
DROP TABLE IF EXISTS codelive_donations CASCADE;
DROP TABLE IF EXISTS demostreamer_donations CASCADE;
DROP TABLE IF EXISTS fitnessflow_donations CASCADE;
DROP TABLE IF EXISTS musicstream_donations CASCADE;
DROP TABLE IF EXISTS techgamer_donations CASCADE;

-- Drop all streamer-related tables
DROP TABLE IF EXISTS obs_token_audit CASCADE;
DROP TABLE IF EXISTS obs_tokens CASCADE;
DROP TABLE IF EXISTS streamers_auth_emails CASCADE;
DROP TABLE IF EXISTS streamers_moderators CASCADE;
DROP TABLE IF EXISTS streamers CASCADE;

-- Drop all utility tables
DROP TABLE IF EXISTS active_websocket_connections CASCADE;
DROP TABLE IF EXISTS admin_emails CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;
DROP TABLE IF EXISTS sensitive_data_access_log CASCADE;