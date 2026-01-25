-- Phase 3B: Add optimized indexes for audio queue and leaderboard queries
-- This reduces database compute time for hot-path queries

-- Audio Queue Indexes (for get-current-audio edge function)
-- Optimizes: WHERE audio_played_at IS NULL AND payment_status = 'success' AND moderation_status IN (...) ORDER BY audio_scheduled_at
CREATE INDEX IF NOT EXISTS idx_abdevil_donations_audio_queue ON abdevil_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ankit_donations_audio_queue ON ankit_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bongflick_donations_audio_queue ON bongflick_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chiaa_gaming_donations_audio_queue ON chiaa_gaming_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clumsygod_donations_audio_queue ON clumsygod_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_damask_plays_donations_audio_queue ON damask_plays_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jhanvoo_donations_audio_queue ON jhanvoo_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jimmy_gaming_donations_audio_queue ON jimmy_gaming_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_looteriya_gaming_donations_audio_queue ON looteriya_gaming_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mriqmaster_donations_audio_queue ON mriqmaster_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neko_xenpai_donations_audio_queue ON neko_xenpai_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notyourkween_donations_audio_queue ON notyourkween_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sagarujjwalgaming_donations_audio_queue ON sagarujjwalgaming_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sizzors_donations_audio_queue ON sizzors_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_thunderx_donations_audio_queue ON thunderx_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vipbhai_donations_audio_queue ON vipbhai_donations (audio_scheduled_at, payment_status, moderation_status) WHERE audio_played_at IS NULL;

-- Leaderboard Indexes (for useLeaderboard and dashboard queries)
-- Optimizes: WHERE payment_status = 'success' AND moderation_status IN ('approved', 'auto_approved')
CREATE INDEX IF NOT EXISTS idx_abdevil_donations_leaderboard ON abdevil_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_ankit_donations_leaderboard ON ankit_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_bongflick_donations_leaderboard ON bongflick_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_chiaa_gaming_donations_leaderboard ON chiaa_gaming_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_clumsygod_donations_leaderboard ON clumsygod_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_damask_plays_donations_leaderboard ON damask_plays_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_jhanvoo_donations_leaderboard ON jhanvoo_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_jimmy_gaming_donations_leaderboard ON jimmy_gaming_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_looteriya_gaming_donations_leaderboard ON looteriya_gaming_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_mriqmaster_donations_leaderboard ON mriqmaster_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_neko_xenpai_donations_leaderboard ON neko_xenpai_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_notyourkween_donations_leaderboard ON notyourkween_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_sagarujjwalgaming_donations_leaderboard ON sagarujjwalgaming_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_sizzors_donations_leaderboard ON sizzors_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_thunderx_donations_leaderboard ON thunderx_donations (payment_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_vipbhai_donations_leaderboard ON vipbhai_donations (payment_status, moderation_status);