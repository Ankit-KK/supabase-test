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
    logoSrc: '/lovable-uploads/ankit-logo.png',
    backgroundSrc: '/lovable-uploads/ankit-background.mp4',
    edgeFunctionName: 'create-razorpay-order-ankit',
    themeDescription: 'Support Ankit with your donation',
  },
  chiaa_gaming: {
    streamerSlug: 'chiaa_gaming',
    streamerName: 'Chiaa Gaming',
    brandColor: '#ec4899',
    logoSrc: '/lovable-uploads/b3a1671f-4c8f-4220-a29f-774bb7851737.png',
    backgroundSrc: '/lovable-uploads/b3a1671f-4c8f-4220-a29f-774bb7851737.png',
    edgeFunctionName: 'create-razorpay-order-chiagaming',
    themeDescription: 'Support Chiaa Gaming with your donation',
  },
};

export const getDonationPageConfig = (slug: string): DonationPageConfig | undefined => {
  return DONATION_PAGE_CONFIGS[slug];
};

export const getAllDonationPageSlugs = (): string[] => {
  return Object.keys(DONATION_PAGE_CONFIGS);
};
