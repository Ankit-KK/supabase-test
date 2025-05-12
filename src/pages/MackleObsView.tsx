
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id: string;
  name: string;
  message: string;
  amount: number;
  created_at: string;
}

const MackleObsView = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        let query = supabase
          .from("mackle_donations")
          .select("id, name, message, amount, created_at")
          .eq("payment_status", "success")
          .order("created_at", { ascending: false })
          .limit(20);
        
        // If we have a specific ID parameter, fetch only that one
        if (id && id !== "messages") {
          query = supabase
            .from("mackle_donations")
            .select("id, name, message, amount, created_at")
            .eq("id", id)
            .single();
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        // Handle the data differently based on what we fetched
        if (id && id !== "messages") {
          // For single donation view
          setDonations(data ? [data] : []);
        } else {
          // For messages view
          setDonations(data || []);
        }
      } catch (err: any) {
        console.error("Error fetching donation:", err);
        setError(err.message || "Failed to load donation data");
      }
    };

    fetchDonations();

    // Set up real-time subscription (only for the messages view)
    if (!id || id === "messages") {
      const channel = supabase
        .channel('mackle-obs-donations')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'mackle_donations',
            filter: 'payment_status=eq.success'
          },
          (payload) => {
            const newDonation = payload.new as Donation;
            console.log("New donation received in OBS view via realtime:", newDonation);
            setDonations(prev => [newDonation, ...prev.slice(0, 19)]); // Keep only latest 20
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    
    return undefined;
  }, [id]);

  // Different view modes based on URL
  const isSingleDonation = id && id !== "messages";
  const isMessagesView = !id || id === "messages";

  // Format amount with commas
  const formatAmount = (amount: number) => {
    return Number(amount).toLocaleString();
  };

  if (error) {
    return (
      <div className="bg-black text-white p-4 min-h-screen flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (isSingleDonation) {
    // Single donation view
    const donation = donations[0];
    
    if (!donation) {
      return (
        <div className="bg-black text-white p-4 min-h-screen flex items-center justify-center">
          <p className="text-yellow-400">Loading donation...</p>
        </div>
      );
    }
    
    return (
      <div className="bg-black text-white p-6 min-h-screen flex flex-col justify-center">
        <div className="mb-4 text-center">
          <span className="text-4xl font-bold text-purple-400">{donation.name}</span>
          <span className="text-4xl text-white"> just donated </span>
          <span className="text-4xl font-bold text-green-400">₹{formatAmount(donation.amount)}</span>
        </div>
        
        {donation.message && (
          <div className="bg-purple-900 bg-opacity-50 p-6 rounded-lg border border-purple-500">
            <p className="text-3xl leading-relaxed">{donation.message}</p>
          </div>
        )}
      </div>
    );
  }

  // Messages view (default)
  return (
    <div className="bg-black text-white p-6 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">Recent Donations</h2>
      
      {donations.length === 0 ? (
        <p className="text-center italic text-gray-400">No donation messages yet</p>
      ) : (
        <div className="space-y-4">
          {donations.map((donation) => (
            <div key={donation.id} className="bg-purple-900 bg-opacity-30 p-4 rounded-lg border border-purple-500">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-purple-300">{donation.name}</span>
                <span className="text-green-400">₹{formatAmount(donation.amount)}</span>
              </div>
              <p className="text-white">{donation.message || <span className="italic text-gray-400">No message</span>}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MackleObsView;
