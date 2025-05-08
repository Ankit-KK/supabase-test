
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

  // Get the current date in ISO format (just the date part)
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch donations from the current date only
  useEffect(() => {
    const fetchTodaysDonations = async () => {
      try {
        const todayStart = `${getCurrentDate()}T00:00:00`;
        const todayEnd = `${getCurrentDate()}T23:59:59`;

        const { data, error } = await supabase
          .from("ankit_donations")
          .select("id, name, amount, message, created_at")
          .eq("payment_status", "failed") // For testing purposes
          .gte("created_at", todayStart)
          .lte("created_at", todayEnd)
          .order("created_at", { ascending: false });
          
        if (error) {
          console.error("Error fetching donations:", error);
          return;
        }
        
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
        
        setIsConnected(true);
      } catch (error) {
        console.error("Error fetching initial donations:", error);
      }
    };

    fetchTodaysDonations();
  }, []);

  // Set up subscription for new donations
  useEffect(() => {
    // Generate a unique channel name based on the OBS view ID
    const channelName = `ankit-obs-donations-${id}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ankit_donations',
          filter: 'payment_status=eq.failed'  // For testing purposes
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

  if (!isConnected) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="text-center text-white">
          <p className="text-lg animate-pulse">Connecting to donation feed...</p>
        </div>
      </div>
    );
  }

  // Render a blank screen when there's no active donation to display
  if (!activeDonation) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="text-center text-white opacity-0">
          <p>Waiting for donations...</p>
        </div>
      </div>
    );
  }

  // Render the active donation with improved layout
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-transparent overflow-hidden">
      <div className="max-w-xl w-full animate-fade-in py-3 px-5 bg-transparent rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-xl text-white">{activeDonation.name}</span>
          <span className="text-green-400 font-bold">
            ₹{Number(activeDonation.amount).toLocaleString()}
          </span>
        </div>
        {activeDonation.message && (
          <div className="text-white text-lg">{activeDonation.message}</div>
        )}
      </div>
    </div>
  );
};

export default AnkitObsView;
