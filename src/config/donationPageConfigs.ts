/**
 * Donation Page Configuration Registry
 * 
 * This file contains visual and branding configurations for donation pages.
 * For core streamer config (slugs, table names, Pusher channels), see streamers.ts
 */

export interface DonationPageConfig {
  streamerSlug: string;
  streamerName: string;
  brandColor: string;
  logoSrc: string;
  backgroundSrc: string;
  cardBackgroundSrc?: string;
  edgeFunctionName: string;
  themeDescription?: string;
  socialLinks?: {
    youtube?: string;
    twitch?: string;
    instagram?: string;
    twitter?: string;
    discord?: string;
  };
}

export const DONATION_PAGE_CONFIGS: Record<string, DonationPageConfig> = {
  ankit: {
    streamerSlug: 'ankit',
    streamerName: 'Ankit',
    brandColor: '#3b82f6',
    logoSrc: '/assets/streamers/ankit-logo.png',
    backgroundSrc: '/assets/streamers/ankit-background.mp4',
    edgeFunctionName: 'create-razorpay-order-ankit',
    themeDescription: 'Support Ankit with your donation',
  },
  chiaa_gaming: {
    streamerSlug: 'chiaa_gaming',
    streamerName: 'Chiaa Gaming',
    brandColor: '#ec4899',
    logoSrc: '/assets/streamers/chiaa-gaming-logo.png',
    backgroundSrc: '/assets/streamers/chiaa-gaming-logo.png',
    edgeFunctionName: 'create-razorpay-order-chiagaming',
    themeDescription: 'Support Chiaa Gaming with your donation',
  },
  clumsy_god: {
    streamerSlug: 'clumsy_god',
    streamerName: 'Clumsy God',
    brandColor: '#10b981',
    logoSrc: '/assets/streamers/clumsy-god-logo.png',
    backgroundSrc: '/assets/streamers/clumsy-god-background.png',
    edgeFunctionName: 'create-razorpay-order-unified',
    themeDescription: 'Support Clumsy God with your donation',
  },
  wolfy: {
    streamerSlug: 'wolfy',
    streamerName: 'Wolfy',
    brandColor: '#f59e0b',
    logoSrc: '/assets/streamers/wolfy-logo.png',
    backgroundSrc: '/assets/streamers/wolfy-background.png',
    edgeFunctionName: 'create-razorpay-order-unified',
    themeDescription: 'Support Wolfy with your donation',
  },
};

export const getDonationPageConfig = (slug: string): DonationPageConfig | undefined => {
  return DONATION_PAGE_CONFIGS[slug];
};

export const getAllDonationPageSlugs = (): string[] => {
  return Object.keys(DONATION_PAGE_CONFIGS);
};
