import type { MessageCharTier } from '@/hooks/useStreamerPricing';

const DEFAULT_MAX_CHARS = 500;

/**
 * Returns the maximum message length for the given amount based on the streamer's
 * configured character tiers. When no tiers are configured, returns a generous default.
 * Tiers are already currency-converted by the backend.
 */
export const getMaxMessageLength = (
  tiers: MessageCharTier[] | null,
  amount: number
): number => {
  if (!tiers || tiers.length === 0) return DEFAULT_MAX_CHARS;

  // Sort descending by min_amount so we match the highest qualifying tier first
  const sorted = [...tiers].sort((a, b) => b.min_amount - a.min_amount);
  const matched = sorted.find((t) => amount >= t.min_amount);

  return matched ? matched.max_chars : sorted[sorted.length - 1].max_chars;
};
