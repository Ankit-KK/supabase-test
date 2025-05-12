
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id: string;
  name: string;
  message: string;
  amount: number;
  created_at: string;
}

interface ActiveDonation extends Donation {
  displayUntil: number;
}

const MackleObsView = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [displayQueue, setDisplayQueue] = useState<ActiveDonation[]>([]);
  const [activeDonation, setActiveDonation] = useState<ActiveDonation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showMessages, setShowMessages] = useState<boolean>(true);
  const { id } = useParams();
  const location = useLocation();
  const DISPLAY_DURATION = 15000; // 15 seconds per message

  // Get URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const messagesParam = queryParams.get("showMessages");
    setShowMessages(messagesParam !== "false");
  }, [location]);

  // Get the current date in ISO format (just the date part)
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        if (id && id !== "messages") {
          // For single donation view
          const { data, error: fetchError } = await supabase
            .from("mackle_donations")
            .select("id, name, message, amount, created_at")
            .eq("id", id)
            .eq("payment_status", "success")
            .single();
            
          if (fetchError) throw fetchError;
          
          setDonations(data ? [data] : []);
        } else {
          // For messages view - get today's donations
          const todayStart = `${getCurrentDate()}T00:00:00`;
          const todayEnd = `${getCurrentDate()}T23:59:59`;

          const { data, error: fetchError } = await supabase
            .from("mackle_donations")
            .select("id, name, message, amount, created_at")
            .eq("payment_status", "success")
            .gte("created_at", todayStart)
            .lte("created_at", todayEnd)
            .order("created_at", { ascending: false });
            
          if (fetchError) throw fetchError;
          
          if (data && data.length > 0) {
            console.log(`Initial donations loaded for ${getCurrentDate()}:`, data.length);
            setDonations(data);
            
            // Add donations directly to display queue
            const donationsForDisplay = data.map(donation => ({
              ...donation,
              displayUntil: Date.now() + DISPLAY_DURATION
            }));
            
            setDisplayQueue(donationsForDisplay);
          } else {
            console.log(`No donations found for ${getCurrentDate()}`);
          }
        }
        
        setIsConnected(true);
      } catch (err: any) {
        console.error("Error fetching donation:", err);
        setError(err.message || "Failed to load donation data");
      }
    };

    fetchDonations();

    // Set up real-time subscription (only for the messages view)
    if (!id || id === "messages") {
      // Generate a unique channel name based on the OBS view ID
      const channelName = `mackle-obs-donations-${id || 'messages'}`;
      
      const channel = supabase
        .channel(channelName)
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
            
            // Check if donation is from today
            const donationDate = new Date(newDonation.created_at).toISOString().split('T')[0];
            const today = getCurrentDate();
            
            if (donationDate === today) {
              console.log("OBS View: New donation received via realtime:", newDonation);
              
              // Add to donations list
              setDonations(prev => [newDonation, ...prev]);
              
              // Add to display queue with display duration
              const newDonationForQueue = {
                ...newDonation,
                displayUntil: Date.now() + DISPLAY_DURATION
              };
              
              console.log("Adding new donation to display queue:", newDonationForQueue.name);
              setDisplayQueue(prev => [...prev, newDonationForQueue]);
            } else {
              console.log("Ignoring donation from a different date:", donationDate);
            }
          }
        )
        .subscribe();

      console.log(`OBS View: Realtime subscription set up with channel ${channelName}`);
      return () => {
        console.log("Cleaning up realtime subscription");
        supabase.removeChannel(channel);
      };
    }
    
    return undefined;
  }, [id]);

  // Handle displaying one donation at a time and properly clearing after all messages
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    
    // If there's an active donation being displayed
    if (activeDonation) {
      // Set a timeout to clear this donation after its display time
      timeout = setTimeout(() => {
        console.log("Finished displaying donation:", activeDonation.name);
        setActiveDonation(null);
      }, DISPLAY_DURATION);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    } 
    // No active donation but we have donations in queue
    else if (displayQueue.length > 0) {
      // Take the first donation from the queue
      const [nextDonation, ...remainingQueue] = displayQueue;
      console.log("Displaying next donation:", nextDonation.name);
      setActiveDonation(nextDonation);
      setDisplayQueue(remainingQueue);
    }
    // No active donation and queue is empty - screen remains blank
    
  }, [activeDonation, displayQueue]);

  // Debug log when displayQueue or activeDonation changes
  useEffect(() => {
    console.log(`OBS View: Display queue has ${displayQueue.length} items, active donation: ${activeDonation?.name || 'none'}`);
  }, [displayQueue, activeDonation]);

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

  if (!isConnected && isMessagesView) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="text-center text-white">
          <p className="text-lg animate-pulse">Connecting to donation feed...</p>
        </div>
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
        
        {showMessages && donation.message && (
          <div className="bg-purple-900 bg-opacity-50 p-6 rounded-lg border border-purple-500">
            <p className="text-3xl leading-relaxed">{donation.message}</p>
          </div>
        )}
      </div>
    );
  }

  // Messages view (default)
  // Render a blank screen when there's no active donation to display
  if (isMessagesView && !activeDonation) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="text-center text-white opacity-0">
          <p>Waiting for donations...</p>
        </div>
      </div>
    );
  }

  // Active message display
  if (isMessagesView && activeDonation) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent overflow-hidden">
        <div className="max-w-xl w-full animate-fade-in backdrop-blur-sm rounded-md px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-lg text-purple-400">{activeDonation.name}</span>
            <span className="text-sm text-purple-300 opacity-80">· ₹{formatAmount(activeDonation.amount)}</span>
          </div>
          
          {showMessages && activeDonation.message && (
            <div className="text-white text-lg mb-2">
              {activeDonation.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for other cases
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
              {showMessages && (
                <p className="text-white">{donation.message || <span className="italic text-gray-400">No message</span>}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MackleObsView;
