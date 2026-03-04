import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Pusher from "pusher-js";

export interface DonationData {
  name: string;
  amount: number;
  currency: string;
  created_at: string;
}

export interface TopDonator {
  name: string;
  totalAmount: number;
}

interface UseLeaderboardOptions {
  donationsTable: string;
  streamerSlug: string;
  pusherKey: string;
  pusherCluster: string;
}

interface UseLeaderboardReturn {
  topDonator: TopDonator | null;
  latestDonations: DonationData[];
  isLoading: boolean;
  refetch: () => void;
}

export const useLeaderboard = ({
  donationsTable,
  streamerSlug,
  pusherKey,
  pusherCluster,
}: UseLeaderboardOptions): UseLeaderboardReturn => {
  const [topDonator, setTopDonator] = useState<TopDonator | null>(null);
  const [latestDonations, setLatestDonations] = useState<DonationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pusherRef = useRef<Pusher | null>(null);

  const fetchDonations = useCallback(async () => {
    try {
      // === EGRESS OPTIMIZATION: Read from aggregation table (1 row, index-only scan) ===
      const { data: topData, error: topError } = await supabase
        .from('streamer_donator_totals' as any)
        .select('donator_name, total_amount')
        .eq('streamer_slug', streamerSlug)
        .order('total_amount', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (topError) {
        console.error(`[useLeaderboard] Error fetching top donator for ${streamerSlug}:`, topError);
      }

      if (topData) {
        setTopDonator({ name: (topData as any).donator_name, totalAmount: (topData as any).total_amount });
      } else {
        setTopDonator(null);
      }

      // Fetch latest 5 donations (already limited, low egress)
      const { data: latestDonationsData, error: latestError } = await supabase
        .from(donationsTable as any)
        .select("name, amount, currency, created_at")
        .eq("payment_status", "success")
        .in("moderation_status", ["auto_approved", "approved"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (latestError) {
        console.error(`[useLeaderboard] Error fetching latest donations from ${donationsTable}:`, latestError);
      }

      if (latestDonationsData) {
        setLatestDonations(latestDonationsData as unknown as DonationData[]);
      } else {
        setLatestDonations([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error(`[useLeaderboard] Error processing donations for ${streamerSlug}:`, error);
      setIsLoading(false);
    }
  }, [donationsTable, streamerSlug]);

  // Initial fetch
  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Pusher subscription for real-time updates
  // Uses pushed leaderboard data directly to avoid full table scans (egress optimization)
  useEffect(() => {
    if (!pusherKey || !pusherCluster) return;

    // Clean up existing connection
    if (pusherRef.current) {
      pusherRef.current.disconnect();
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });
    pusherRef.current = pusher;

    const channel = pusher.subscribe(`${streamerSlug}-dashboard`);

    // Use pre-computed leaderboard data from backend (no full table scan)
    channel.bind("leaderboard-updated", (data: { topDonator: TopDonator | null; latestDonation: DonationData }) => {
      console.log(`[useLeaderboard] Leaderboard update received for ${streamerSlug}`, data);
      if (data.topDonator) {
        setTopDonator(data.topDonator);
      }
      if (data.latestDonation) {
        setLatestDonations(prev => {
          // Prepend new donation, keep only 5
          const updated = [data.latestDonation, ...prev.filter(d => 
            d.name !== data.latestDonation.name || d.created_at !== data.latestDonation.created_at
          )].slice(0, 5);
          return updated;
        });
      }
    });

    // Note: donation-approved fallback removed - leaderboard-updated events now handle this case

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`${streamerSlug}-dashboard`);
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [pusherKey, pusherCluster, streamerSlug, fetchDonations]);

  return {
    topDonator,
    latestDonations,
    isLoading,
    refetch: fetchDonations,
  };
};
