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
  // Note: Existing streamers (chiaa_gaming, looteriya_gaming, etc.) 
  // continue to use their own dedicated page components.
  // This config is for NEW streamers using DonationPageWrapper.
  
  // Example configuration for reference:
  // new_streamer: {
  //   streamerSlug: 'new_streamer',
  //   streamerName: 'New Streamer',
  //   brandColor: '#ec4899',
  //   logoSrc: '/lovable-uploads/new-streamer-logo.png',
  //   backgroundSrc: '/lovable-uploads/new-streamer-bg.jpg',
  //   cardBackgroundSrc: '/lovable-uploads/new-streamer-card.jpg',
  //   edgeFunctionName: 'create-razorpay-order-newstreamer',
  //   themeDescription: 'Support New Streamer with your donation',
  //   socialLinks: {
  //     youtube: 'https://youtube.com/@newstreamer',
  //     instagram: 'https://instagram.com/newstreamer',
  //   },
  // },
};

export const getDonationPageConfig = (slug: string): DonationPageConfig | undefined => {
  return DONATION_PAGE_CONFIGS[slug];
};

export const getAllDonationPageSlugs = (): string[] => {
  return Object.keys(DONATION_PAGE_CONFIGS);
};
