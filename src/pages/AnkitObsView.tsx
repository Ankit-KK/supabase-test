import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUp } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
}

interface ActiveDonation extends Donation {
  displayUntil: number;
}

const AnkitObsView = () => {
  const { id } = useParams<{ id: string }>();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [displayQueue, setDisplayQueue] = useState<ActiveDonation[]>([]);
  const [activeDonation, setActiveDonation] = useState<ActiveDonation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const DISPLAY_DURATION = 15000; // 15 seconds per message

  // Fetch initial donations that are 'failed' (for testing purposes)
  useEffect(() => {
    const fetchInitialDonations = async () => {
      try {
        const { data, error } = await supabase
          .from("ankit_donations")
          .select("id, name, amount, message, created_at")
          .eq("payment_status", "failed")
          .order("created_at", { ascending: false })
          .limit(10);
          
        if (error) {
          console.error("Error fetching donations:", error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log("Initial donations loaded:", data.length);
          setDonations(data);
        } else {
          console.log("No donations found during initial load");
        }
        
        setIsConnected(true);
      } catch (error) {
        console.error("Error fetching initial donations:", error);
      }
    };

    fetchInitialDonations();

    // Set up a refresh interval
    const refreshInterval = setInterval(fetchInitialDonations, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Set up subscription for new donations with 'failed' status (for testing purposes)
  useEffect(() => {
    const channel = supabase
      .channel('ankit-donations-changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ankit_donations',
          filter: 'payment_status=eq.failed'  // Changed to 'failed' for testing
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log("New donation received via realtime:", newDonation);
          
          setDonations(prev => [newDonation, ...prev]);
          
          // Add newly received donation directly to the display queue
          const newDonationForQueue = {
            ...newDonation,
            displayUntil: Date.now() + DISPLAY_DURATION
          };
          
          setDisplayQueue(prev => [...prev, newDonationForQueue]);
        }
      )
      .subscribe();

    console.log("Realtime subscription set up for payment_status=failed");
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Process initial donations into the display queue
  useEffect(() => {
    if (donations.length > 0 && displayQueue.length === 0) {
      // Only add donations to the queue if there's nothing there yet
      // (for initial display only)
      console.log("Adding initial donations to display queue");
      const initialQueue = donations.map(donation => ({
        ...donation,
        displayUntil: Date.now() + DISPLAY_DURATION
      }));
      
      setDisplayQueue(initialQueue);
    }
  }, [donations, displayQueue]);

  // Handle displaying one donation at a time
  useEffect(() => {
    // If no active donation, show the next one from the queue
    if (!activeDonation && displayQueue.length > 0) {
      // Take the first donation from the queue
      const [nextDonation, ...remainingQueue] = displayQueue;
      console.log("Displaying next donation:", nextDonation.name);
      setActiveDonation(nextDonation);
      setDisplayQueue(remainingQueue);
      
      // Set a timeout to clear this donation after its display time
      const timeout = setTimeout(() => {
        console.log("Finished displaying donation, moving to next");
        setActiveDonation(null);
      }, DISPLAY_DURATION);
      
      return () => clearTimeout(timeout);
    }
    
    // Note: We no longer recycle donations after they've all been displayed
    // This will keep the screen blank until new donations arrive
    
  }, [activeDonation, displayQueue]);

  // Debug log when displayQueue or activeDonation changes
  useEffect(() => {
    console.log(`Display queue has ${displayQueue.length} items, active donation: ${activeDonation?.name || 'none'}`);
  }, [displayQueue, activeDonation]);

  if (!isConnected) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="text-center text-white">
          <p className="text-lg animate-pulse">Connecting to donation feed...</p>
        </div>
      </div>
    );
  }

  if (!activeDonation) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="text-center text-white opacity-0">
          <p>Waiting for donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-transparent overflow-hidden">
      <div className="max-w-xl w-full animate-fade-in py-4 px-6 bg-black/80 rounded-lg shadow-lg text-white">
        <div className="flex items-center gap-3 mb-3">
          <ArrowUp className="h-5 w-5 text-green-400" />
          <span className="font-bold text-xl">{activeDonation.name}</span>
          <span className="text-green-400 font-bold ml-auto">
            ₹{Number(activeDonation.amount).toLocaleString()}
          </span>
        </div>
        <div className="text-lg">{activeDonation.message}</div>
      </div>
    </div>
  );
};

export default AnkitObsView;
