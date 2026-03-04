/**
 * Centralized Streamer Configuration Registry
 * Active streamers only: Ankit, Chiaa Gaming, Looteriya Gaming
 */

export interface StreamerConfig {
  slug: string;
  name: string;
  tableName: string;
  brandColor: string;
  pusherDashboardChannel: string;
  pusherGoalChannel: string;
  pusherAudioChannel: string;
  pusherAlertsChannel: string;
  pusherSettingsChannel: string;
  razorpayOrderPrefix: string;
}

// Convenience aliases
export const getAlertsChannel = (c: StreamerConfig) => c.pusherAlertsChannel;
export const getSettingsChannel = (c: StreamerConfig) => c.pusherSettingsChannel;

export const STREAMER_CONFIGS: Record<string, StreamerConfig> = {
  ankit: {
    slug: 'ankit', name: 'Ankit', tableName: 'ankit_donations', brandColor: '#3b82f6',
    pusherDashboardChannel: 'ankit-dashboard', pusherGoalChannel: 'ankit-goal', pusherAudioChannel: 'ankit-audio',
    pusherAlertsChannel: 'ankit-alerts', pusherSettingsChannel: 'ankit-settings', razorpayOrderPrefix: 'ank_rp_',
  },
  chiaa_gaming: {
    slug: 'chiaa_gaming', name: 'Chiaa Gaming', tableName: 'chiaa_gaming_donations', brandColor: '#ec4899',
    pusherDashboardChannel: 'chiaa_gaming-dashboard', pusherGoalChannel: 'chiaa_gaming-goal', pusherAudioChannel: 'chiaa_gaming-audio',
    pusherAlertsChannel: 'chiaa_gaming-alerts', pusherSettingsChannel: 'chiaa_gaming-settings', razorpayOrderPrefix: 'cg_rp_',
  },
  looteriya_gaming: {
    slug: 'looteriya_gaming', name: 'Looteriya Gaming', tableName: 'looteriya_gaming_donations', brandColor: '#a855f7',
    pusherDashboardChannel: 'looteriya_gaming-dashboard', pusherGoalChannel: 'looteriya_gaming-goal', pusherAudioChannel: 'looteriya_gaming-audio',
    pusherAlertsChannel: 'looteriya_gaming-alerts', pusherSettingsChannel: 'looteriya_gaming-settings', razorpayOrderPrefix: 'lg_rp_',
  },
  clumsy_god: {
    slug: 'clumsy_god', name: 'Clumsy God', tableName: 'clumsy_god_donations', brandColor: '#10b981',
    pusherDashboardChannel: 'clumsy_god-dashboard', pusherGoalChannel: 'clumsy_god-goal', pusherAudioChannel: 'clumsy_god-audio',
    pusherAlertsChannel: 'clumsy_god-alerts', pusherSettingsChannel: 'clumsy_god-settings', razorpayOrderPrefix: 'cg2_rp_',
  },
  wolfy: {
    slug: 'wolfy', name: 'Wolfy', tableName: 'wolfy_donations', brandColor: '#f59e0b',
    pusherDashboardChannel: 'wolfy-dashboard', pusherGoalChannel: 'wolfy-goal', pusherAudioChannel: 'wolfy-audio',
    pusherAlertsChannel: 'wolfy-alerts', pusherSettingsChannel: 'wolfy-settings', razorpayOrderPrefix: 'wf_rp_',
  },
  dorp_plays: {
    slug: 'dorp_plays', name: 'DorpPlays', tableName: 'dorp_plays_donations', brandColor: '#6366f1',
    pusherDashboardChannel: 'dorp_plays-dashboard', pusherGoalChannel: 'dorp_plays-goal', pusherAudioChannel: 'dorp_plays-audio',
    pusherAlertsChannel: 'dorp_plays-alerts', pusherSettingsChannel: 'dorp_plays-settings', razorpayOrderPrefix: 'dp2_rp_',
  },
  zishu: {
    slug: 'zishu', name: 'Zishu', tableName: 'zishu_donations', brandColor: '#a855f7',
    pusherDashboardChannel: 'zishu-dashboard', pusherGoalChannel: 'zishu-goal', pusherAudioChannel: 'zishu-audio',
    pusherAlertsChannel: 'zishu-alerts', pusherSettingsChannel: 'zishu-settings', razorpayOrderPrefix: 'zs_rp_',
  },
  brigzard: {
    slug: 'brigzard', name: 'BRIGZARD', tableName: 'brigzard_donations', brandColor: '#4a5c3e',
    pusherDashboardChannel: 'brigzard-dashboard', pusherGoalChannel: 'brigzard-goal', pusherAudioChannel: 'brigzard-audio',
    pusherAlertsChannel: 'brigzard-alerts', pusherSettingsChannel: 'brigzard-settings', razorpayOrderPrefix: 'bz_rp_',
  },
  w_era: {
    slug: 'w_era', name: 'W Era', tableName: 'w_era_donations', brandColor: '#3b82f6',
    pusherDashboardChannel: 'w_era-dashboard', pusherGoalChannel: 'w_era-goal', pusherAudioChannel: 'w_era-audio',
    pusherAlertsChannel: 'w_era-alerts', pusherSettingsChannel: 'w_era-settings', razorpayOrderPrefix: 'we_rp_',
  },
  mr_champion: {
    slug: 'mr_champion', name: 'Mr Champion', tableName: 'mr_champion_donations', brandColor: '#eab308',
    pusherDashboardChannel: 'mr_champion-dashboard', pusherGoalChannel: 'mr_champion-goal', pusherAudioChannel: 'mr_champion-audio',
    pusherAlertsChannel: 'mr_champion-alerts', pusherSettingsChannel: 'mr_champion-settings', razorpayOrderPrefix: 'mc_rp_',
  },
};

export const getStreamerConfig = (slug: string): StreamerConfig | undefined => STREAMER_CONFIGS[slug];
export const getAllStreamerSlugs = (): string[] => Object.keys(STREAMER_CONFIGS);
export const getAllStreamerConfigs = (): StreamerConfig[] => Object.values(STREAMER_CONFIGS);

export const EXCHANGE_RATES_TO_INR: Record<string, number> = { 'INR': 1, 'USD': 89, 'EUR': 94, 'GBP': 113, 'AED': 24, 'AUD': 57 };
export const convertToINR = (amount: number, currency: string = 'INR'): number => (EXCHANGE_RATES_TO_INR[currency] || 1) * amount;

// Mapping from donation_table_id (smallint) in order_lookup to table name
export const DONATION_TABLE_ID_MAP: Record<number, string> = {
  0: 'ankit_donations',
  1: 'chiaa_gaming_donations',
  2: 'looteriya_gaming_donations',
  3: 'clumsy_god_donations',
  4: 'wolfy_donations',
  5: 'dorp_plays_donations',
  6: 'zishu_donations',
  7: 'brigzard_donations',
  8: 'w_era_donations',
  9: 'mr_champion_donations',
};

// Reverse mapping: table name -> donation_table_id
export const TABLE_NAME_TO_ID: Record<string, number> = Object.fromEntries(
  Object.entries(DONATION_TABLE_ID_MAP).map(([id, name]) => [name, parseInt(id)])
);

export const PUSHER_EVENTS = { NEW_DONATION: 'new-donation', DONATION_APPROVED: 'donation-approved', DONATION_UPDATED: 'donation-updated', NEW_AUDIO_MESSAGE: 'new-audio-message', GOAL_PROGRESS: 'goal-progress', STATS_UPDATED: 'stats-updated' } as const;
export const MODERATION_STATUS = { PENDING: 'pending', AUTO_APPROVED: 'auto_approved', APPROVED: 'approved', REJECTED: 'rejected' } as const;
export const ENV_KEYS = { RAZORPAY_KEY_ID: 'razorpay-keyid', RAZORPAY_KEY_SECRET: 'razorpay-keysecret', SUPABASE_URL: 'SUPABASE_URL', SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY' } as const;
