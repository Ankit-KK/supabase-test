
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad, Flame } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  include_gif?: boolean;
}

interface ActiveDonation extends Donation {
  displayUntil: number;
}

const MackletvObsView = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [displayQueue, setDisplayQueue] = useState<ActiveDonation[]>([]);
  const [activeDonation, setActiveDonation] = useState<ActiveDonation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showMessages, setShowMessages] = useState<boolean>(true);
  const [showGif, setShowGif] = useState<boolean>(false);
  const DISPLAY_DURATION = 15000; // 15 seconds per message
  const GIF_DURATION = 5000; // 5 seconds for the GIF

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

  // Log the connection process
  useEffect(() => {
    console.log("Initializing MackletvObsView with ID:", id);
  }, [id]);

  // Fetch donations from the current date only
  useEffect(() => {
    const fetchTodaysDonations = async () => {
      try {
        const todayStart = `${getCurrentDate()}T00:00:00`;
        const todayEnd = `${getCurrentDate()}T23:59:59`;

        console.log("Fetching donations from", todayStart, "to", todayEnd);

        const { data, error } = await supabase
          .from("mackletv_donations")
          .select("id, name, amount, message, created_at, include_gif")
          .eq("payment_status", "success") 
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
    const channelName = `mackletv-obs-donations-${id || 'default'}`;
    
    console.log("Setting up realtime subscription with channel:", channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mackletv_donations',
          filter: 'payment_status=eq.success'
        },
        (payload) => {
          console.log("Received realtime INSERT event:", payload);
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
            
            // Show GIF if the include_gif option is true
            if (newDonation.include_gif) {
              setShowGif(true);
              setTimeout(() => {
                setShowGif(false);
              }, GIF_DURATION);
            }
          } else {
            console.log("Ignoring donation from a different date:", donationDate);
          }
        }
      )
      .subscribe((status) => {
        console.log("Channel subscription status:", status);
      });

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
        
        // Show GIF if the include_gif option is true and not already showing
        if (activeDonation.include_gif && !showGif) {
          setShowGif(true);
          setTimeout(() => {
            setShowGif(false);
          }, GIF_DURATION);
        }
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
    
  }, [activeDonation, displayQueue, showGif]);

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

  // Render a blank screen when there's no active donation to display and no GIF
  if (!activeDonation && !showGif) {
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
      {showGif && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="w-96 h-96 flex items-center justify-center">
            <img 
              src="https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/dancing-dog.gif?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhbmtpdC9kYW5jaW5nLWRvZy5naWYiLCJpYXQiOjE3NDY4OTc4ODEsImV4cCI6MTc3ODQzMzg4MX0.tIzwiI3aBlSujCQIn0zQfUGLXfsMPc4wEgrpPZO15_k" 
              alt="Celebration GIF" 
              className="max-w-full max-h-full object-contain animate-scale-in" 
            />
          </div>
        </div>
      )}
      
      {activeDonation && (
        <div className="max-w-xl w-full animate-fade-in backdrop-blur-sm rounded-md px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-lg text-purple-400">{activeDonation.name}</span>
            <span className="text-sm text-purple-300 opacity-80">· ₹{Number(activeDonation.amount).toLocaleString()}</span>
          </div>
          
          {showMessages && activeDonation.message && (
            <div className="text-white text-lg mb-2">
              {activeDonation.message}
            </div>
          )}
          
          <div className="flex space-x-2 mt-1">
            <Gamepad className="h-5 w-5 text-purple-400" />
            <Flame className="h-5 w-5 text-orange-400" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MackletvObsView;
