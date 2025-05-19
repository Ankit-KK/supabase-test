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
}

interface ActiveDonation extends Donation {
  displayUntil: number;
}

const AnkitObsView = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [displayQueue, setDisplayQueue] = useState<ActiveDonation[]>([]);
  const [activeDonation, setActiveDonation] = useState<ActiveDonation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showMessages, setShowMessages] = useState<boolean>(true);
  const [showBorder, setShowBorder] = useState<boolean>(false);
  const DISPLAY_DURATION = 15000; // 15 seconds per message

  // Get URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const messagesParam = queryParams.get("showMessages");
    const borderParam = queryParams.get("showBorder");
    
    setShowMessages(messagesParam !== "false");
    setShowBorder(borderParam === "true");
    
    console.log("OBS View parameters - showMessages:", messagesParam !== "false", "showBorder:", borderParam === "true");
  }, [location]);

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
    const channelName = `ankit-obs-donations-${id}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ankit_donations',
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

  // Draggable and resizable functionality
  useEffect(() => {
    if (!activeDonation) return;

    const messageBox = document.getElementById('messageBox');
    const resizeHandle = document.getElementById('resizeHandle');
    if (!messageBox || !resizeHandle) return;

    let isDragging = false;
    let isResizing = false;
    let dragOffsetX = 0, dragOffsetY = 0;
    let resizeInitialX = 0, resizeInitialY = 0;
    let initialWidth = 0, initialHeight = 0;

    const REFERENCE_WIDTH = 300;
    const BASE_FONT_SIZE = 16;
    const MIN_FONT_SIZE = 8;

    function updateScale(width: number) {
      const scaleFactor = width / REFERENCE_WIDTH;
      const newFontSize = Math.max(MIN_FONT_SIZE, BASE_FONT_SIZE * scaleFactor);
      if (messageBox) messageBox.style.fontSize = `${newFontSize}px`;
    }

    // Initialize position if not set
    if (!messageBox.style.left) messageBox.style.left = '50px';
    if (!messageBox.style.top) messageBox.style.top = '50px';
    if (!messageBox.style.width) messageBox.style.width = '300px';
    updateScale(messageBox.offsetWidth);

    // Mouse events for dragging
    messageBox.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === messageBox) {
        isDragging = true;
        dragOffsetX = e.clientX - messageBox.getBoundingClientRect().left;
        dragOffsetY = e.clientY - messageBox.getBoundingClientRect().top;
        messageBox.style.cursor = 'move';
      }
    });

    // Mouse events for resizing
    resizeHandle?.addEventListener('mousedown', (e: MouseEvent) => {
      isResizing = true;
      resizeInitialX = e.clientX;
      resizeInitialY = e.clientY;
      initialWidth = messageBox.offsetWidth;
      initialHeight = messageBox.offsetHeight;
      e.stopPropagation();
    });

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffsetX;
        const newY = e.clientY - dragOffsetY;
        messageBox.style.left = `${Math.max(0, newX)}px`;
        messageBox.style.top = `${Math.max(0, newY)}px`;
      } else if (isResizing && messageBox) {
        const dx = e.clientX - resizeInitialX;
        const dy = e.clientY - resizeInitialY;
        const newWidth = Math.max(100, initialWidth + dx);
        const newHeight = Math.max(70, initialHeight + dy);
        messageBox.style.width = `${newWidth}px`;
        messageBox.style.height = `${newHeight}px`;
        updateScale(newWidth);
      }
    };

    // Mouse up handler
    const handleMouseUp = () => {
      isDragging = false;
      isResizing = false;
      if (messageBox) messageBox.style.cursor = 'default';
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Touch events
    messageBox.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.target === messageBox) {
        isDragging = true;
        const touch = e.touches[0];
        dragOffsetX = touch.clientX - messageBox.getBoundingClientRect().left;
        dragOffsetY = touch.clientY - messageBox.getBoundingClientRect().top;
      }
    });

    resizeHandle?.addEventListener('touchstart', (e: TouchEvent) => {
      isResizing = true;
      const touch = e.touches[0];
      resizeInitialX = touch.clientX;
      resizeInitialY = touch.clientY;
      initialWidth = messageBox.offsetWidth;
      initialHeight = messageBox.offsetHeight;
      e.stopPropagation();
    });

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging && !isResizing) return;
      
      const touch = e.touches[0];
      if (isDragging && messageBox) {
        const newX = touch.clientX - dragOffsetX;
        const newY = touch.clientY - dragOffsetY;
        messageBox.style.left = `${Math.max(0, newX)}px`;
        messageBox.style.top = `${Math.max(0, newY)}px`;
      } else if (isResizing && messageBox) {
        const dx = touch.clientX - resizeInitialX;
        const dy = touch.clientY - resizeInitialY;
        const newWidth = Math.max(100, initialWidth + dx);
        const newHeight = Math.max(70, initialHeight + dy);
        messageBox.style.width = `${newWidth}px`;
        messageBox.style.height = `${newHeight}px`;
        updateScale(newWidth);
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
      isResizing = false;
    };

    // Add touch event listeners
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeDonation]);

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

  // Updated UI with draggable and resizable container
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-transparent overflow-hidden">
      <style>
        {`
        #messageBox {
          position: absolute;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 25px;
          color: white;
          min-width: 100px;
          min-height: 70px;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
          text-shadow: 1px 1px 2px #000000, -1px -1px 2px #000000, 1px -1px 2px #000000, -1px 1px 2px #000000;
          user-select: none;
          overflow: hidden;
        }
        #resizeHandle {
          position: absolute;
          bottom: 0px;
          right: 0px;
          width: 15px;
          height: 15px;
          background-color: rgba(204, 204, 204, 0.5);
          border-top-left-radius: 10px;
          cursor: nwse-resize;
          z-index: 10;
        }
        `}
      </style>
      
      <div 
        id="messageBox"
        className={`animate-fade-in ${showBorder ? 'border-2 border-dashed border-gray-400' : ''}`}
        style={{ width: "auto", maxWidth: "90vw" }}
      >
        <div id="resizeHandle"></div>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-xl text-yellow-400">{activeDonation.name}</span>
          <span className="text-md text-white opacity-90">· ₹{Number(activeDonation.amount).toLocaleString()}</span>
        </div>
        
        {showMessages && activeDonation.message && (
          <div className="text-white text-lg mt-2 font-medium">
            {activeDonation.message}
          </div>
        )}
        
        <div className="flex space-x-2 mt-3">
          <Gamepad className="h-5 w-5 text-purple-400" />
          <Flame className="h-5 w-5 text-orange-400" />
        </div>
      </div>
    </div>
  );
};

export default AnkitObsView;
