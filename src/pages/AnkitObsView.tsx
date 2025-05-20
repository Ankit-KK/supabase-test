
import React, { useEffect, useState, useRef } from "react";
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
  const messageBoxRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const isResizingRef = useRef<boolean>(false);
  const dragOffsetRef = useRef<{x: number, y: number}>({x: 0, y: 0});
  const resizeInitialRef = useRef<{x: number, y: number, width: number, height: number}>({x: 0, y: 0, width: 0, height: 0});
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

  // Enhanced draggable and resizable functionality
  useEffect(() => {
    const messageBox = messageBoxRef.current;
    const resizeHandle = resizeHandleRef.current;
    if (!messageBox || !resizeHandle) return;

    // Initialize position if not set
    if (!messageBox.style.left) messageBox.style.left = '50px';
    if (!messageBox.style.top) messageBox.style.top = '50px';
    if (!messageBox.style.width) messageBox.style.width = '300px';
    
    const REFERENCE_WIDTH = 300;
    const BASE_FONT_SIZE = 16;
    const MIN_FONT_SIZE = 8;

    // Update font size based on box width
    const updateScale = (width: number) => {
      const scaleFactor = width / REFERENCE_WIDTH;
      const newFontSize = Math.max(MIN_FONT_SIZE, BASE_FONT_SIZE * scaleFactor);
      if (messageBox) messageBox.style.fontSize = `${newFontSize}px`;
    };
    
    // Initialize scale
    updateScale(messageBox.offsetWidth);
    
    // Mouse down handler for dragging
    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === messageBox) {
        isDraggingRef.current = true;
        dragOffsetRef.current = {
          x: e.clientX - messageBox.getBoundingClientRect().left,
          y: e.clientY - messageBox.getBoundingClientRect().top
        };
        messageBox.style.cursor = 'move';
        e.preventDefault();
      }
    };
    
    // Mouse down handler for resizing
    const handleResizeMouseDown = (e: MouseEvent) => {
      isResizingRef.current = true;
      resizeInitialRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: messageBox.offsetWidth,
        height: messageBox.offsetHeight
      };
      e.stopPropagation();
      e.preventDefault();
    };
    
    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const newX = e.clientX - dragOffsetRef.current.x;
        const newY = e.clientY - dragOffsetRef.current.y;
        messageBox.style.left = `${Math.max(0, newX)}px`;
        messageBox.style.top = `${Math.max(0, newY)}px`;
      } else if (isResizingRef.current) {
        const dx = e.clientX - resizeInitialRef.current.x;
        const dy = e.clientY - resizeInitialRef.current.y;
        const newWidth = Math.max(100, resizeInitialRef.current.width + dx);
        const newHeight = Math.max(70, resizeInitialRef.current.height + dy);
        messageBox.style.width = `${newWidth}px`;
        messageBox.style.height = `${newHeight}px`;
        updateScale(newWidth);
      }
    };
    
    // Mouse up handler
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      if (messageBox) messageBox.style.cursor = 'default';
    };
    
    // Touch start handler for dragging
    const handleTouchStart = (e: TouchEvent) => {
      if (e.target === messageBox) {
        isDraggingRef.current = true;
        const touch = e.touches[0];
        dragOffsetRef.current = {
          x: touch.clientX - messageBox.getBoundingClientRect().left,
          y: touch.clientY - messageBox.getBoundingClientRect().top
        };
        e.preventDefault();
      }
    };
    
    // Touch start handler for resizing
    const handleResizeTouchStart = (e: TouchEvent) => {
      isResizingRef.current = true;
      const touch = e.touches[0];
      resizeInitialRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        width: messageBox.offsetWidth,
        height: messageBox.offsetHeight
      };
      e.stopPropagation();
      e.preventDefault();
    };
    
    // Touch move handler
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current || isResizingRef.current) {
        const touch = e.touches[0];
        
        if (isDraggingRef.current) {
          const newX = touch.clientX - dragOffsetRef.current.x;
          const newY = touch.clientY - dragOffsetRef.current.y;
          messageBox.style.left = `${Math.max(0, newX)}px`;
          messageBox.style.top = `${Math.max(0, newY)}px`;
        } else if (isResizingRef.current) {
          const dx = touch.clientX - resizeInitialRef.current.x;
          const dy = touch.clientY - resizeInitialRef.current.y;
          const newWidth = Math.max(100, resizeInitialRef.current.width + dx);
          const newHeight = Math.max(70, resizeInitialRef.current.height + dy);
          messageBox.style.width = `${newWidth}px`;
          messageBox.style.height = `${newHeight}px`;
          updateScale(newWidth);
        }
        
        e.preventDefault();
      }
    };
    
    // Touch end handler
    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
    };
    
    // Add event listeners
    messageBox.addEventListener('mousedown', handleMouseDown);
    resizeHandle.addEventListener('mousedown', handleResizeMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    messageBox.addEventListener('touchstart', handleTouchStart);
    resizeHandle.addEventListener('touchstart', handleResizeTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    // Cleanup event listeners
    return () => {
      messageBox.removeEventListener('mousedown', handleMouseDown);
      resizeHandle.removeEventListener('mousedown', handleResizeMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      messageBox.removeEventListener('touchstart', handleTouchStart);
      resizeHandle.removeEventListener('touchstart', handleResizeTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []); // Only run once on mount

  if (!isConnected) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="text-center text-white">
          <p className="text-lg animate-pulse">Connecting to donation feed...</p>
        </div>
      </div>
    );
  }

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
          width: 20px;
          height: 20px;
          background-color: rgba(204, 204, 204, 0.7);
          border-top-left-radius: 10px;
          cursor: nwse-resize;
          z-index: 10;
        }
        .box-outline-visible {
          border: 4px dashed #FFFFFF !important;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 255, 255, 0.5) !important;
        }
        `}
      </style>
      
      <div 
        id="messageBox"
        ref={messageBoxRef}
        className={`${activeDonation ? 'animate-fade-in' : ''} ${showBorder ? 'box-outline-visible' : ''}`}
        style={{ width: "300px", maxWidth: "90vw", left: "50px", top: "50px" }}
      >
        <div id="resizeHandle" ref={resizeHandleRef}></div>
        {activeDonation ? (
          <>
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
          </>
        ) : (
          // Placeholder content when no active donation (only visible when showBorder is true)
          showBorder && (
            <div className="text-white text-center opacity-40">
              <p>Message box preview</p>
              <p className="text-xs">Drag to position and resize as needed</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AnkitObsView;
