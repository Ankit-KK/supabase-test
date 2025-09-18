-- Drop all database functions and tables to clean up the project

-- Drop all triggers first
DROP TRIGGER IF EXISTS auto_approve_ankit_hyperemotes ON ankit_donations;
DROP TRIGGER IF EXISTS auto_approve_demostreamer_hyperemotes ON demostreamer_donations;
DROP TRIGGER IF EXISTS auto_approve_hyperemotes ON chia_gaming_donations;
DROP TRIGGER IF EXISTS auto_approve_newstreamer_hyperemotes ON newstreamer_donations;
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

-- Drop all functions
DROP FUNCTION IF EXISTS auto_approve_ankit_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS auto_approve_ankit_hyperemotes_iu() CASCADE;
DROP FUNCTION IF EXISTS auto_approve_demostreamer_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS auto_approve_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS auto_approve_newstreamer_hyperemotes() CASCADE;
DROP FUNCTION IF EXISTS authenticate_streamer(text, text) CASCADE;
DROP FUNCTION IF EXISTS add_admin_email(text) CASCADE;
DROP FUNCTION IF EXISTS add_streamer_auth_email(text, text) CASCADE;
DROP FUNCTION IF EXISTS can_access_admin_emails() CASCADE;
DROP FUNCTION IF EXISTS check_and_rotate_expired_tokens() CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit(text, text, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS check_streamer_email_allowed(text, text) CASCADE;
DROP FUNCTION IF EXISTS check_username_exists(text) CASCADE;
DROP FUNCTION IF EXISTS check_username_exists(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_websocket_connections() CASCADE;
DROP FUNCTION IF EXISTS create_streamer_for_user() CASCADE;
DROP FUNCTION IF EXISTS create_visits_table() CASCADE;
DROP FUNCTION IF EXISTS encrypt_obs_token(text) CASCADE;
DROP FUNCTION IF EXISTS get_active_obs_token(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_admin_streamers(text) CASCADE;
DROP FUNCTION IF EXISTS get_alerts_donations(text, text) CASCADE;
DROP FUNCTION IF EXISTS get_alerts_for_obs_token(text, text) CASCADE;
DROP FUNCTION IF EXISTS get_my_moderators(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_page_visitor_stats(text) CASCADE;
DROP FUNCTION IF EXISTS get_public_streamer_info(text) CASCADE;
DROP FUNCTION IF EXISTS get_recent_donations_public(text, integer) CASCADE;
DROP FUNCTION IF EXISTS get_streamer_by_obs_token(text) CASCADE;
DROP FUNCTION IF EXISTS get_streamer_by_obs_token_v2(text) CASCADE;
DROP FUNCTION IF EXISTS get_streamer_by_slug(text) CASCADE;
DROP FUNCTION IF EXISTS get_streamer_moderator_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_streamer_public_settings(text) CASCADE;
DROP FUNCTION IF EXISTS get_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_signups_secure(text) CASCADE;
DROP FUNCTION IF EXISTS get_visitor_stats() CASCADE;
DROP FUNCTION IF EXISTS hash_obs_token(text) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS is_admin_email(text) CASCADE;
DROP FUNCTION IF EXISTS is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS is_current_user_admin() CASCADE;
DROP FUNCTION IF EXISTS is_service_role() CASCADE;
DROP FUNCTION IF EXISTS is_valid_streamer_operation(uuid) CASCADE;
DROP FUNCTION IF EXISTS link_streamer_to_current_user(text) CASCADE;
DROP FUNCTION IF EXISTS log_access_attempt(text, text, uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS log_auth_email_access() CASCADE;
DROP FUNCTION IF EXISTS log_donation_modification() CASCADE;
DROP FUNCTION IF EXISTS log_moderator_access() CASCADE;
DROP FUNCTION IF EXISTS log_obs_token_access() CASCADE;
DROP FUNCTION IF EXISTS log_security_event(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS log_sensitive_access(text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS record_streamer_login(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS regenerate_obs_token(uuid, text, timestamp with time zone) CASCADE;
DROP FUNCTION IF EXISTS remove_admin_email(text) CASCADE;
DROP FUNCTION IF EXISTS remove_streamer_auth_email(text, text) CASCADE;
DROP FUNCTION IF EXISTS safe_export_user_signups(text) CASCADE;
DROP FUNCTION IF EXISTS update_streamer_auth_email(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_user_profile(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS validate_donation_amount(numeric) CASCADE;
DROP FUNCTION IF EXISTS validate_donation_insert(numeric, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS validate_obs_token(text) CASCADE;
DROP FUNCTION IF EXISTS validate_obs_token_secure(text) CASCADE;
DROP FUNCTION IF EXISTS validate_obs_token_secure_with_audit(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS validate_streamer_credentials(text, text) CASCADE;
DROP FUNCTION IF EXISTS verify_moderator_access(text, text) CASCADE;