
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { StreamerTableName } from "@/types/donations";
import type { StreamerConfig } from "@/config/streamerConfigs";

interface ObsViewProps {
  tableName: StreamerTableName;
  donationId: string;
  streamerConfig: StreamerConfig;
}

interface DonationRecord {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const ObsView = ({ tableName, donationId, streamerConfig }: ObsViewProps) => {
  const [donation, setDonation] = useState<DonationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (donationId === "latest") {
      fetchLatestDonation();
    } else {
      fetchSpecificDonation(donationId);
    }
  }, [tableName, donationId]);

  const fetchLatestDonation = async () => {
    try {
      console.log(`Fetching latest donation from table: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('payment_status', 'success')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching latest donation:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch latest donation",
        });
        return;
      }

      setDonation(data?.[0] || null);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificDonation = async (id: string) => {
    try {
      console.log(`Fetching specific donation: ${id} from table: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching specific donation:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch donation",
        });
        return;
      }

      setDonation(data);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Donation Found</h2>
          <p className="text-gray-400">Waiting for donations...</p>
        </div>
      </div>
    );
  }

  // Special styling for different streamers
  if (streamerConfig.name === "rakazone") {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-8"
        style={{
          background: streamerConfig.theme.backgroundColor,
        }}
      >
        <div className={`${streamerConfig.theme.cardBackground} border-${streamerConfig.theme.borderColor} rounded-lg p-8 max-w-2xl w-full text-center shadow-lg`}>
          {streamerConfig.features.hasLogo && (
            <img 
              src={streamerConfig.features.logoUrl} 
              alt={`${streamerConfig.displayName} Logo`} 
              className="h-16 w-16 mx-auto mb-4"
            />
          )}
          <h1 className={`text-4xl font-bold text-${streamerConfig.theme.primaryColor} mb-4`}>
            New Donation!
          </h1>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">{donation.name}</h2>
            <div className={`text-3xl font-bold text-${streamerConfig.theme.primaryColor}`}>
              {formatCurrency(donation.amount)}
            </div>
          </div>
          <div className="bg-black/40 rounded-lg p-4">
            <p className="text-lg text-gray-200 leading-relaxed">{donation.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (streamerConfig.name === "chiaa_gaming") {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-8"
        style={{
          background: streamerConfig.theme.backgroundColor,
        }}
      >
        <div className={`${streamerConfig.theme.cardBackground} border-${streamerConfig.theme.borderColor} rounded-lg p-8 max-w-2xl w-full text-center shadow-lg`}>
          <h1 className={`text-4xl font-bold bg-gradient-to-r from-${streamerConfig.theme.primaryColor} to-${streamerConfig.theme.secondaryColor} bg-clip-text text-transparent mb-4`}>
            New Donation! 💕
          </h1>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-pink-800 mb-2">{donation.name}</h2>
            <div className={`text-3xl font-bold bg-gradient-to-r from-${streamerConfig.theme.primaryColor} to-${streamerConfig.theme.secondaryColor} bg-clip-text text-transparent`}>
              {formatCurrency(donation.amount)}
            </div>
          </div>
          <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
            <p className="text-lg text-pink-900 leading-relaxed">{donation.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Default styling for other streamers
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full text-center shadow-lg">
        <h1 className="text-4xl font-bold text-primary mb-4">New Donation!</h1>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{donation.name}</h2>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(donation.amount)}
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-lg text-gray-700 leading-relaxed">{donation.message}</p>
        </div>
      </div>
    </div>
  );
};

export default ObsView;
