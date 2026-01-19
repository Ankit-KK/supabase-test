/**
 * Centralized Streamer Configuration Registry
 * 
 * This file contains all streamer configurations in one place for consistency.
 * When adding a new streamer, add their config here and use it throughout the app.
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
  razorpayOrderPrefix: string;
}

/**
 * All streamer configurations
 * 
 * Naming conventions:
 * - slug: snake_case, matches database streamer_slug
 * - tableName: matches database table name (e.g., "looteriya_gaming_donations")
 * - razorpayOrderPrefix: short prefix for order IDs (e.g., "lg_rp_" for Looteriya Gaming)
 */
export const STREAMER_CONFIGS: Record<string, StreamerConfig> = {
  abdevil: {
    slug: 'abdevil',
    name: 'ABdevil',
    tableName: 'abdevil_donations',
    brandColor: '#f97316',
    pusherDashboardChannel: 'abdevil-dashboard',
    pusherGoalChannel: 'abdevil-goal',
    pusherAudioChannel: 'abdevil-audio',
    pusherAlertsChannel: 'abdevil-alerts',
    razorpayOrderPrefix: 'ab_rp_',
  },
  ankit: {
    slug: 'ankit',
    name: 'Ankit',
    tableName: 'ankit_donations',
    brandColor: '#3b82f6',
    pusherDashboardChannel: 'ankit-dashboard',
    pusherGoalChannel: 'ankit-goal',
    pusherAudioChannel: 'ankit-audio',
    pusherAlertsChannel: 'ankit-alerts',
    razorpayOrderPrefix: 'ank_rp_',
  },
  bongflick: {
    slug: 'bongflick',
    name: 'BongFlick',
    tableName: 'bongflick_donations',
    brandColor: '#8b5cf6',
    pusherDashboardChannel: 'bongflick-dashboard',
    pusherGoalChannel: 'bongflick-goal',
    pusherAudioChannel: 'bongflick-audio',
    pusherAlertsChannel: 'bongflick-alerts',
    razorpayOrderPrefix: 'bf_rp_',
  },
  chiaa_gaming: {
    slug: 'chiaa_gaming',
    name: 'Chiaa Gaming',
    tableName: 'chiaa_gaming_donations',
    brandColor: '#ec4899',
    pusherDashboardChannel: 'chiaa_gaming-dashboard',
    pusherGoalChannel: 'chiaa_gaming-goal',
    pusherAudioChannel: 'chiaa_gaming-audio',
    pusherAlertsChannel: 'chiaa_gaming-alerts',
    razorpayOrderPrefix: 'cg_rp_',
  },
  clumsygod: {
    slug: 'clumsygod',
    name: 'ClumsyGod',
    tableName: 'clumsygod_donations',
    brandColor: '#10b981',
    pusherDashboardChannel: 'clumsygod-dashboard',
    pusherGoalChannel: 'clumsygod-goal',
    pusherAudioChannel: 'clumsygod-audio',
    pusherAlertsChannel: 'clumsygod-alerts',
    razorpayOrderPrefix: 'cg_rp_',
  },
  damask_plays: {
    slug: 'damask_plays',
    name: 'Damask Plays',
    tableName: 'damask_plays_donations',
    brandColor: '#10b981',
    pusherDashboardChannel: 'damask_plays-dashboard',
    pusherGoalChannel: 'damask_plays-goal',
    pusherAudioChannel: 'damask_plays-audio',
    pusherAlertsChannel: 'damask_plays-alerts',
    razorpayOrderPrefix: 'dp_rp_',
  },
  jhanvoo: {
    slug: 'jhanvoo',
    name: 'Jhanvoo',
    tableName: 'jhanvoo_donations',
    brandColor: '#6366f1',
    pusherDashboardChannel: 'jhanvoo-dashboard',
    pusherGoalChannel: 'jhanvoo-goal',
    pusherAudioChannel: 'jhanvoo-audio',
    pusherAlertsChannel: 'jhanvoo-alerts',
    razorpayOrderPrefix: 'jh_rp_',
  },
  jimmy_gaming: {
    slug: 'jimmy_gaming',
    name: 'Jimmy Gaming',
    tableName: 'jimmy_gaming_donations',
    brandColor: '#ef4444',
    pusherDashboardChannel: 'jimmy_gaming-dashboard',
    pusherGoalChannel: 'jimmy_gaming-goal',
    pusherAudioChannel: 'jimmy_gaming-audio',
    pusherAlertsChannel: 'jimmy_gaming-alerts',
    razorpayOrderPrefix: 'jg_rp_',
  },
  looteriya_gaming: {
    slug: 'looteriya_gaming',
    name: 'Looteriya Gaming',
    tableName: 'looteriya_gaming_donations',
    brandColor: '#f59e0b',
    pusherDashboardChannel: 'looteriya_gaming-dashboard',
    pusherGoalChannel: 'looteriya_gaming-goal',
    pusherAudioChannel: 'looteriya_gaming-audio',
    pusherAlertsChannel: 'looteriya_gaming-alerts',
    razorpayOrderPrefix: 'lg_rp_',
  },
  mriqmaster: {
    slug: 'mriqmaster',
    name: 'Mr Iqmaster',
    tableName: 'mriqmaster_donations',
    brandColor: '#06b6d4',
    pusherDashboardChannel: 'mriqmaster-dashboard',
    pusherGoalChannel: 'mriqmaster-goal',
    pusherAudioChannel: 'mriqmaster-audio',
    pusherAlertsChannel: 'mriqmaster-alerts',
    razorpayOrderPrefix: 'mi_rp_',
  },
  neko_xenpai: {
    slug: 'neko_xenpai',
    name: 'Neko Xenpai',
    tableName: 'neko_xenpai_donations',
    brandColor: '#f43f5e',
    pusherDashboardChannel: 'neko_xenpai-dashboard',
    pusherGoalChannel: 'neko_xenpai-goal',
    pusherAudioChannel: 'neko_xenpai-audio',
    pusherAlertsChannel: 'neko_xenpai-alerts',
    razorpayOrderPrefix: 'nx_rp_',
  },
  notyourkween: {
    slug: 'notyourkween',
    name: 'Not Your Kween',
    tableName: 'notyourkween_donations',
    brandColor: '#d946ef',
    pusherDashboardChannel: 'notyourkween-dashboard',
    pusherGoalChannel: 'notyourkween-goal',
    pusherAudioChannel: 'notyourkween-audio',
    pusherAlertsChannel: 'notyourkween-alerts',
    razorpayOrderPrefix: 'nyk_rp_',
  },
  sagarujjwalgaming: {
    slug: 'sagarujjwalgaming',
    name: 'Sagar Ujjwal Gaming',
    tableName: 'sagarujjwalgaming_donations',
    brandColor: '#84cc16',
    pusherDashboardChannel: 'sagarujjwalgaming-dashboard',
    pusherGoalChannel: 'sagarujjwalgaming-goal',
    pusherAudioChannel: 'sagarujjwalgaming-audio',
    pusherAlertsChannel: 'sagarujjwalgaming-alerts',
    razorpayOrderPrefix: 'sug_rp_',
  },
  sizzors: {
    slug: 'sizzors',
    name: 'Sizzors',
    tableName: 'sizzors_donations',
    brandColor: '#14b8a6',
    pusherDashboardChannel: 'sizzors-dashboard',
    pusherGoalChannel: 'sizzors-goal',
    pusherAudioChannel: 'sizzors-audio',
    pusherAlertsChannel: 'sizzors-alerts',
    razorpayOrderPrefix: 'sz_rp_',
  },
  thunderx: {
    slug: 'thunderx',
    name: 'ThunderX',
    tableName: 'thunderx_donations',
    brandColor: '#eab308',
    pusherDashboardChannel: 'thunderx-dashboard',
    pusherGoalChannel: 'thunderx-goal',
    pusherAudioChannel: 'thunderx-audio',
    pusherAlertsChannel: 'thunderx-alerts',
    razorpayOrderPrefix: 'tx_rp_',
  },
  vipbhai: {
    slug: 'vipbhai',
    name: 'VIP BHAI',
    tableName: 'vipbhai_donations',
    brandColor: '#a855f7',
    pusherDashboardChannel: 'vipbhai-dashboard',
    pusherGoalChannel: 'vipbhai-goal',
    pusherAudioChannel: 'vipbhai-audio',
    pusherAlertsChannel: 'vipbhai-alerts',
    razorpayOrderPrefix: 'vb_rp_',
  },
};

/**
 * Get streamer config by slug
 */
export const getStreamerConfig = (slug: string): StreamerConfig | undefined => 
  STREAMER_CONFIGS[slug];

/**
 * Get all streamer slugs
 */
export const getAllStreamerSlugs = (): string[] => 
  Object.keys(STREAMER_CONFIGS);

/**
 * Get all streamer configs as array
 */
export const getAllStreamerConfigs = (): StreamerConfig[] => 
  Object.values(STREAMER_CONFIGS);

/**
 * Exchange rates for currency conversion (used in goal calculations and revenue)
 * Update these rates periodically
 */
export const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  'INR': 1,
  'USD': 89,
  'EUR': 94,
  'GBP': 113,
  'AED': 24,
  'AUD': 57,
};

/**
 * Convert amount to INR using exchange rates
 */
export const convertToINR = (amount: number, currency: string = 'INR'): number => {
  const rate = EXCHANGE_RATES_TO_INR[currency] || 1;
  return amount * rate;
};

/**
 * Standardized Pusher event names - use these in all edge functions
 */
export const PUSHER_EVENTS = {
  NEW_DONATION: 'new-donation',
  DONATION_APPROVED: 'donation-approved',
  DONATION_UPDATED: 'donation-updated',
  NEW_AUDIO_MESSAGE: 'new-audio-message',
  GOAL_PROGRESS: 'goal-progress',
  STATS_UPDATED: 'stats-updated',
} as const;

/**
 * Standardized moderation status values
 */
export const MODERATION_STATUS = {
  PENDING: 'pending',
  AUTO_APPROVED: 'auto_approved',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

/**
 * Standardized environment variable names for edge functions
 */
export const ENV_KEYS = {
  RAZORPAY_KEY_ID: 'razorpay-keyid',
  RAZORPAY_KEY_SECRET: 'razorpay-keysecret',
  SUPABASE_URL: 'SUPABASE_URL',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
} as const;
