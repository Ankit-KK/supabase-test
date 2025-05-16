
import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id: string;
  name: string;
  message: string;
  amount: number;
  created_at: string;
  include_sound?: boolean;
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
  const [pageLoadTime, setPageLoadTime] = useState<string>(new Date().toISOString());
  const { id } = useParams();
  const location = useLocation();
  const DISPLAY_DURATION = 15000; // 15 seconds per message
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const messagesParam = queryParams.get("showMessages");
    setShowMessages(messagesParam !== "false");
    
    // Set the initial page load time - we'll use this to filter donations
    const timestamp = Date.now();
    setPageLoadTime(new Date(timestamp).toISOString());
    console.log("Page loaded at:", new Date(timestamp).toLocaleString());
  }, [location]);

  // Get the current date in ISO format (just the date part)
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        // For messages view - we fetch the donations for today
        const todayStart = `${getCurrentDate()}T00:00:00`;
        const todayEnd = `${getCurrentDate()}T23:59:59`;
        
        // Load time - used to only show donations that came in after the page was loaded
        const loadTimeISO = pageLoadTime;
        console.log("Only showing donations after:", loadTimeISO);
        
        // Build our query - only fetch donations AFTER the page load time
        const { data, error: fetchError } = await supabase
          .from("mackle_donations")
          .select("id, name, message, amount, created_at, include_sound")
          .eq("payment_status", "success")
          .gte("created_at", loadTimeISO)
          .lte("created_at", todayEnd)
          .order("created_at", { ascending: false });
        
        if (fetchError) throw fetchError;
        
        if (data && data.length > 0) {
          console.log(`Initial donations loaded:`, data.length);
          setDonations(data);
          
          // Add donations directly to display queue
          const donationsForDisplay = data.map(donation => ({
            ...donation,
            displayUntil: Date.now() + DISPLAY_DURATION
          }));
          
          setDisplayQueue(donationsForDisplay);
        } else {
          console.log(`No donations found matching the criteria`);
        }
        
        setIsConnected(true);
      } catch (err: any) {
        console.error("Error fetching donation:", err);
        setError(err.message || "Failed to load donation data");
      }
    };

    fetchDonations();

    // Set up real-time subscription (only for the messages view)
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
          
          // Check if donation is from today AND created after the page was loaded
          const donationDate = new Date(newDonation.created_at).toISOString().split('T')[0];
          const today = getCurrentDate();
          
          // Check if the donation came in after our page load time
          const donationTimestamp = new Date(newDonation.created_at).getTime();
          const pageLoadTimestamp = new Date(pageLoadTime).getTime();
          
          if (donationDate === today && donationTimestamp > pageLoadTimestamp) {
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
            if (donationDate !== today) {
              console.log("Ignoring donation from a different date:", donationDate);
            } else {
              console.log("Ignoring donation from before the page was loaded");
            }
          }
        }
      )
      .subscribe();

    console.log(`OBS View: Realtime subscription set up with channel ${channelName}`);
    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [id, pageLoadTime]);

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

  // Play sound when a donation with include_sound is active
  useEffect(() => {
    if (activeDonation?.include_sound) {
      console.log("Playing sound for Casepaglu donation");
      const audio = new Audio("https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/gold.mp3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhbmtpdC9nb2xkLm1wMyIsImlhdCI6MTc0NzI5MzEyMSwiZXhwIjoxODEwMzY1MTIxfQ.k_I3m4REekeMqTGSahxNJ-TCe4NhQ_RJsW8QoVnjo1M");
      audioRef.current = audio;
      audio.play().catch(err => {
        console.error("Error playing sound:", err);
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [activeDonation]);

  // Debug log when displayQueue or activeDonation changes
  useEffect(() => {
    console.log(`OBS View: Display queue has ${displayQueue.length} items, active donation: ${activeDonation?.name || 'none'}`);
  }, [displayQueue, activeDonation]);

  if (error) {
    return (
      <div className="bg-black text-white p-4 min-h-screen flex items-center justify-center">
        <p className="text-rose-400">{error}</p>
      </div>
    );
  }

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

  // Active message display with left-aligned positioning
  return (
    <div className="h-screen w-screen flex items-start justify-start bg-transparent overflow-hidden">
      <div 
        className="max-w-xl animate-fade-in bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl m-4"
        style={{ width: "auto", maxWidth: "90vw" }} // Dynamic width based on content
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-xl text-yellow-400">{activeDonation.name}</span>
          <span className="text-md text-white opacity-90">· ₹{Number(activeDonation.amount).toLocaleString()}</span>
        </div>
        
        {showMessages && activeDonation.message && (
          <div className="text-white text-lg mt-2 font-medium">
            {activeDonation.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default MackleObsView;
