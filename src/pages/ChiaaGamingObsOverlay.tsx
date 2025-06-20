import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ObsConfigProvider } from "@/contexts/ObsConfigContext";
import DraggableResizableBox from "@/components/DraggableResizableBox";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
  gif_url?: string;
  voice_url?: string;
  custom_sound_url?: string;
}

// Global queues for sequential processing with improved cleanup and 1-minute delay
const globalMessageQueue: { donation: Donation; scheduledTime: number }[] = [];
const globalGifQueue: { donation: Donation; duration: number; scheduledTime: number }[] = [];
const globalCustomSoundQueue: { donation: Donation; audioElement: HTMLAudioElement; scheduledTime: number }[] = [];
const globalVoiceQueue: { donation: Donation; audioElement: HTMLAudioElement; duration: number; scheduledTime: number }[] = [];

// Global processing states
let isProcessingMessages = false;
let isProcessingGifs = false;
let isProcessingCustomSounds = false;
let isProcessingVoiceRecordings = false;

let globalProcessingTimeout: NodeJS.Timeout | null = null;
const processedDonationIds = new Set<string>();

// 1-minute delay constant (60000 milliseconds)
const ALERT_DELAY_MS = 60000;

// Global cleanup function to prevent memory leaks
const cleanupGlobalState = () => {
  // Clear all queues
  globalMessageQueue.length = 0;
  globalGifQueue.length = 0;
  
  // Clean up audio elements
  globalCustomSoundQueue.forEach(item => {
    try {
      item.audioElement.pause();
      item.audioElement.src = '';
    } catch (error) {
      console.warn('Error cleaning up custom sound audio element:', error);
    }
  });
  globalCustomSoundQueue.length = 0;
  
  globalVoiceQueue.forEach(item => {
    try {
      item.audioElement.pause();
      item.audioElement.src = '';
    } catch (error) {
      console.warn('Error cleaning up voice audio element:', error);
    }
  });
  globalVoiceQueue.length = 0;
  
  // Reset processing states
  isProcessingMessages = false;
  isProcessingGifs = false;
  isProcessingCustomSounds = false;
  isProcessingVoiceRecordings = false;
  
  // Clear timeout
  if (globalProcessingTimeout) {
    clearTimeout(globalProcessingTimeout);
    globalProcessingTimeout = null;
  }
  
  // Clear processed IDs
  processedDonationIds.clear();
};

const ChiaaGamingObsOverlay = () => {
  const { obsId } = useParams();
  const [searchParams] = useSearchParams();
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [currentCustomSoundAlert, setCurrentCustomSoundAlert] = useState<Donation | null>(null);
  const [currentVoiceAlert, setCurrentVoiceAlert] = useState<Donation | null>(null);
  const [currentGifAlert, setCurrentGifAlert] = useState<Donation | null>(null);
  const [totalDonations, setTotalDonations] = useState(0);
  
  // Use ref to track component instance
  const componentId = useRef(Math.random().toString(36).substring(2, 9));
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Parse URL parameters
  const showMessages = searchParams.get("showMessages") === "true";
  const showGoal = searchParams.get("showGoal") === "true";
  const goalName = searchParams.get("goalName") || "Gaming Goal";
  const goalTarget = parseInt(searchParams.get("goalTarget") || "1000");

  console.log("OBS Overlay loaded with params:", {
    obsId,
    showMessages,
    showGoal,
    goalName,
    goalTarget,
    componentId: componentId.current,
    alertDelay: `${ALERT_DELAY_MS / 1000} seconds`
  });

  // Clean up media after it's displayed with improved error handling
  const cleanupMedia = async (donationId: string, mediaUrl: string, mediaType: 'gif' | 'voice') => {
    try {
      console.log(`Cleaning up ${mediaType} for donation:`, donationId);
      
      // Mark as displayed with error handling
      try {
        const { error: updateError } = await supabase
          .from("donation_gifs")
          .update({ 
            displayed_at: new Date().toISOString(),
            status: 'displayed'
          })
          .eq("donation_id", donationId)
          .eq("file_type", mediaType);

        if (updateError) {
          console.error(`Error marking ${mediaType} as displayed:`, updateError);
        }
      } catch (dbError) {
        console.error(`Database error when marking ${mediaType} as displayed:`, dbError);
      }

      // Extract filename safely
      try {
        const urlParts = mediaUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        if (fileName) {
          const { error: deleteError } = await supabase.storage
            .from('donation-gifs')
            .remove([fileName]);

          if (deleteError) {
            console.error(`Error deleting ${mediaType} file:`, deleteError);
          } else {
            console.log(`${mediaType} file deleted successfully:`, fileName);
          }

          // Mark as deleted
          try {
            const { error: markDeletedError } = await supabase
              .from("donation_gifs")
              .update({ 
                deleted_at: new Date().toISOString(),
                status: 'deleted'
              })
              .eq("donation_id", donationId)
              .eq("file_type", mediaType);

            if (markDeletedError) {
              console.error(`Error marking ${mediaType} as deleted:`, markDeletedError);
            }
          } catch (markError) {
            console.error(`Error marking ${mediaType} as deleted:`, markError);
          }
        }
      } catch (fileError) {
        console.error(`Error processing file deletion for ${mediaType}:`, fileError);
      }

    } catch (error) {
      console.error(`Error in cleanup${mediaType}:`, error);
    }
  };

  // Process message queue with delay check (highest priority)
  const processNextMessage = () => {
    if (globalMessageQueue.length === 0) {
      isProcessingMessages = false;
      processNextGif();
      return;
    }

    if (isProcessingMessages) {
      return;
    }

    const now = Date.now();
    const nextItem = globalMessageQueue[0];
    
    // Check if enough time has passed for the delay
    if (now < nextItem.scheduledTime) {
      const remainingDelay = nextItem.scheduledTime - now;
      console.log(`[${componentId.current}] Message delayed for ${remainingDelay}ms more`);
      globalProcessingTimeout = setTimeout(() => {
        processNextMessage();
      }, remainingDelay);
      return;
    }

    isProcessingMessages = true;
    const messageItem = globalMessageQueue.shift();
    
    if (!messageItem) {
      isProcessingMessages = false;
      processNextGif();
      return;
    }

    const { donation } = messageItem;
    
    console.log(`[${componentId.current}] Processing delayed message from queue:`, donation.id, donation.name);
    
    // Mark this donation as processed
    processedDonationIds.add(donation.id);
    
    // Show the donation on all component instances
    setCurrentDonation(donation);

    // Auto-hide after 12 seconds
    const hideTimeout = setTimeout(() => {
      console.log(`[${componentId.current}] Hiding message after 12 seconds:`, donation.id);
      
      setCurrentDonation(null);
      isProcessingMessages = false;
      
      // Process next message after 3 seconds
      globalProcessingTimeout = setTimeout(() => {
        processNextMessage();
      }, 3000);
    }, 12000);
  };

  // Process GIF queue with delay check (second priority)
  const processNextGif = () => {
    if (globalGifQueue.length === 0) {
      isProcessingGifs = false;
      processNextCustomSound();
      return;
    }

    if (isProcessingGifs) {
      return;
    }

    const now = Date.now();
    const nextItem = globalGifQueue[0];
    
    // Check if enough time has passed for the delay
    if (now < nextItem.scheduledTime) {
      const remainingDelay = nextItem.scheduledTime - now;
      console.log(`[${componentId.current}] GIF delayed for ${remainingDelay}ms more`);
      globalProcessingTimeout = setTimeout(() => {
        processNextGif();
      }, remainingDelay);
      return;
    }

    isProcessingGifs = true;
    const gifItem = globalGifQueue.shift();
    
    if (!gifItem) {
      isProcessingGifs = false;
      processNextCustomSound();
      return;
    }

    const { donation, duration } = gifItem;
    
    console.log(`[${componentId.current}] Showing delayed GIF alert:`, donation.name, `Duration: ${duration}ms`);
    
    // Show the GIF alert
    setCurrentGifAlert(donation);
    
    // Set a timeout for the GIF duration
    const gifTimeout = setTimeout(() => {
      console.log(`[${componentId.current}] GIF timeout reached, hiding alert`);
      setCurrentGifAlert(null);
      isProcessingGifs = false;
      
      // Clean up the GIF after display
      if (donation.gif_url) {
        cleanupMedia(donation.id, donation.gif_url, 'gif');
      }
      
      setTimeout(() => {
        processNextGif();
      }, 500);
    }, duration);
  };

  // Process custom sound queue with delay check (third priority)
  const processNextCustomSound = () => {
    if (globalCustomSoundQueue.length === 0) {
      isProcessingCustomSounds = false;
      processNextVoiceRecording();
      return;
    }

    if (isProcessingCustomSounds) {
      return;
    }

    const now = Date.now();
    const nextItem = globalCustomSoundQueue[0];
    
    // Check if enough time has passed for the delay
    if (now < nextItem.scheduledTime) {
      const remainingDelay = nextItem.scheduledTime - now;
      console.log(`[${componentId.current}] Custom sound delayed for ${remainingDelay}ms more`);
      globalProcessingTimeout = setTimeout(() => {
        processNextCustomSound();
      }, remainingDelay);
      return;
    }

    isProcessingCustomSounds = true;
    const soundItem = globalCustomSoundQueue.shift();
    
    if (!soundItem) {
      isProcessingCustomSounds = false;
      processNextVoiceRecording();
      return;
    }

    const { donation, audioElement } = soundItem;
    
    console.log(`[${componentId.current}] Playing delayed custom sound and showing alert:`, donation.name);
    
    // Show the custom sound alert
    setCurrentCustomSoundAlert(donation);
    
    audioElement.onended = () => {
      console.log(`[${componentId.current}] Custom sound ended, hiding alert`);
      setCurrentCustomSoundAlert(null);
      isProcessingCustomSounds = false;
      
      setTimeout(() => {
        processNextCustomSound();
      }, 500);
    };
    
    audioElement.onerror = (e) => {
      console.error(`[${componentId.current}] Failed to play custom sound:`, e);
      setCurrentCustomSoundAlert(null);
      isProcessingCustomSounds = false;
      
      setTimeout(() => {
        processNextCustomSound();
      }, 500);
    };
    
    audioElement.play().catch(e => {
      console.error(`[${componentId.current}] Audio play failed:`, e);
      setCurrentCustomSoundAlert(null);
      isProcessingCustomSounds = false;
      setTimeout(() => {
        processNextCustomSound();
      }, 500);
    });
  };

  // Process voice recording queue with delay check (lowest priority)
  const processNextVoiceRecording = () => {
    if (globalVoiceQueue.length === 0) {
      isProcessingVoiceRecordings = false;
      return;
    }

    if (isProcessingVoiceRecordings) {
      return;
    }

    const now = Date.now();
    const nextItem = globalVoiceQueue[0];
    
    // Check if enough time has passed for the delay
    if (now < nextItem.scheduledTime) {
      const remainingDelay = nextItem.scheduledTime - now;
      console.log(`[${componentId.current}] Voice recording delayed for ${remainingDelay}ms more`);
      globalProcessingTimeout = setTimeout(() => {
        processNextVoiceRecording();
      }, remainingDelay);
      return;
    }

    isProcessingVoiceRecordings = true;
    const voiceItem = globalVoiceQueue.shift();
    
    if (!voiceItem) {
      isProcessingVoiceRecordings = false;
      return;
    }

    const { donation, audioElement, duration } = voiceItem;
    
    console.log(`[${componentId.current}] Playing delayed voice recording and showing alert:`, donation.name, `Duration: ${duration}ms`);
    
    // Show the voice recording alert
    setCurrentVoiceAlert(donation);
    
    audioElement.onended = () => {
      console.log(`[${componentId.current}] Voice recording ended, hiding alert`);
      setCurrentVoiceAlert(null);
      isProcessingVoiceRecordings = false;
      
      // Clean up voice recording after playback
      if (donation.voice_url) {
        cleanupMedia(donation.id, donation.voice_url, 'voice');
      }
      
      setTimeout(() => {
        processNextVoiceRecording();
      }, 500);
    };
    
    audioElement.onerror = (e) => {
      console.error(`[${componentId.current}] Failed to play voice recording:`, e);
      setCurrentVoiceAlert(null);
      isProcessingVoiceRecordings = false;
      
      setTimeout(() => {
        processNextVoiceRecording();
      }, 500);
    };
    
    // Set a timeout based on the calculated duration as fallback
    const fallbackTimeout = setTimeout(() => {
      console.log(`[${componentId.current}] Voice recording timeout reached, hiding alert`);
      setCurrentVoiceAlert(null);
      isProcessingVoiceRecordings = false;
      
      // Clean up voice recording
      if (donation.voice_url) {
        cleanupMedia(donation.id, donation.voice_url, 'voice');
      }
      
      setTimeout(() => {
        processNextVoiceRecording();
      }, 500);
    }, duration);
    
    // Clear fallback timeout if audio ends normally
    const originalOnEnded = audioElement.onended;
    audioElement.onended = () => {
      clearTimeout(fallbackTimeout);
      if (originalOnEnded) originalOnEnded.call(audioElement);
    };
    
    audioElement.play().catch(e => {
      console.error(`[${componentId.current}] Voice audio play failed:`, e);
      clearTimeout(fallbackTimeout);
      setCurrentVoiceAlert(null);
      isProcessingVoiceRecordings = false;
      setTimeout(() => {
        processNextVoiceRecording();
      }, 500);
    });
  };

  // Add donation to queues in priority order with 1-minute delay: messages first, then GIFs, then sounds
  const addDonationToQueues = (donation: Donation) => {
    // Skip processing if payment is not successful
    if (donation.payment_status !== "success") {
      console.log(`[${componentId.current}] Skipping donation processing - payment not successful:`, {
        donationId: donation.id,
        name: donation.name,
        paymentStatus: donation.payment_status
      });
      return;
    }

    const scheduledTime = Date.now() + ALERT_DELAY_MS;
    const delayMinutes = ALERT_DELAY_MS / 60000;
    
    console.log(`[${componentId.current}] Processing donation with ${delayMinutes}-minute delay:`, {
      donationId: donation.id,
      name: donation.name,
      hasCustomSound: !!donation.custom_sound_url,
      hasVoice: !!donation.voice_url,
      hasGif: !!donation.gif_url,
      hasMessage: !!donation.message,
      amount: donation.amount,
      paymentStatus: donation.payment_status,
      scheduledTime: new Date(scheduledTime).toLocaleTimeString()
    });

    // 1. ALWAYS add message to queue first if messages are enabled and has text message content
    if (showMessages && donation.message && donation.message.trim()) {
      console.log(`[${componentId.current}] Adding message to delayed queue (${delayMinutes} min delay):`, donation.id);
      globalMessageQueue.push({ donation, scheduledTime });
    }

    // 2. Add GIF to queue (will be processed after messages)
    if (donation.gif_url) {
      console.log(`[${componentId.current}] Adding GIF to delayed queue (${delayMinutes} min delay):`, donation.id);
      const duration = 12000; // 12 seconds for GIFs
      globalGifQueue.push({ donation, duration, scheduledTime });
    }

    // 3. Add custom sound to queue (will be processed after GIFs)
    if (donation.custom_sound_url && Number(donation.amount) >= 100) {
      console.log(`[${componentId.current}] Adding custom sound to delayed queue (${delayMinutes} min delay):`, donation.id);
      try {
        const audio = new Audio(donation.custom_sound_url);
        audio.volume = 0.7;
        audio.preload = 'auto';
        globalCustomSoundQueue.push({ donation, audioElement: audio, scheduledTime });
      } catch (error) {
        console.error(`[${componentId.current}] Error creating custom sound audio element:`, error);
      }
    }

    // 4. Add voice recording to queue (will be processed after custom sounds)
    if (donation.voice_url && Number(donation.amount) >= 100) {
      console.log(`[${componentId.current}] Adding voice recording to delayed queue (${delayMinutes} min delay):`, donation.id);
      try {
        const audio = new Audio(donation.voice_url);
        audio.volume = 0.8;
        audio.preload = 'auto';
        const duration = Number(donation.amount) < 150 ? 30000 : 60000; // 30s or 60s
        globalVoiceQueue.push({ donation, audioElement: audio, duration, scheduledTime });
      } catch (error) {
        console.error(`[${componentId.current}] Error creating voice audio element:`, error);
      }
    }
    
    console.log(`[${componentId.current}] Updated delayed queue lengths:`, {
      messages: globalMessageQueue.length,
      gifs: globalGifQueue.length,
      customSounds: globalCustomSoundQueue.length,
      voice: globalVoiceQueue.length,
      total: globalMessageQueue.length + globalGifQueue.length + globalCustomSoundQueue.length + globalVoiceQueue.length,
      nextScheduledAlert: globalMessageQueue.length > 0 ? new Date(globalMessageQueue[0].scheduledTime).toLocaleTimeString() : 'None'
    });

    // Start processing if not already processing (messages have highest priority)
    if (!isProcessingMessages && !isProcessingGifs && !isProcessingCustomSounds && !isProcessingVoiceRecordings) {
      console.log(`[${componentId.current}] Starting delayed sequential queue processing`);
      setTimeout(() => {
        processNextMessage();
      }, 100);
    }

    // Mark as processed to avoid duplicate processing
    processedDonationIds.add(donation.id);
  };

  useEffect(() => {
    // Fetch today's total donations for goal progress - ONLY SUCCESSFUL PAYMENTS
    const fetchTotalDonations = async () => {
      try {
        const today = new Date();
        const todayStart = `${today.toISOString().split('T')[0]}T00:00:00`;
        const todayEnd = `${today.toISOString().split('T')[0]}T23:59:59`;
        
        const { data, error } = await supabase
          .from("chiaa_gaming_donations")
          .select("amount")
          .eq("payment_status", "success") // Only count successful payments
          .gte("created_at", todayStart)
          .lte("created_at", todayEnd);

        if (error) {
          console.error('Error fetching total donations:', error);
          return;
        }

        if (data) {
          const total = data.reduce((sum, donation) => sum + Number(donation.amount), 0);
          setTotalDonations(total);
        }
      } catch (error) {
        console.error('Exception when fetching total donations:', error);
      }
    };

    fetchTotalDonations();

    // Set up real-time subscription ONLY for successful donations
    const channel = supabase
      .channel(`chiaa-gaming-obs-${obsId}-${componentId.current}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chiaa_gaming_donations',
          filter: 'payment_status=eq.success' // CRITICAL: Only listen for successful payments
        },
        (payload) => {
          try {
            const newDonation = payload.new as Donation;
            console.log(`[${componentId.current}] Successful donation received in OBS overlay (will be delayed ${ALERT_DELAY_MS/60000} minutes):`, {
              id: newDonation.id,
              name: newDonation.name,
              amount: newDonation.amount,
              payment_status: newDonation.payment_status
            });
            
            // Double-check payment status (safety check)
            if (newDonation.payment_status !== "success") {
              console.log(`[${componentId.current}] Blocking non-successful donation from OBS processing:`, newDonation.payment_status);
              return;
            }
            
            // Update total for goal only if payment is successful
            setTotalDonations(prev => prev + Number(newDonation.amount));
            console.log(`[${componentId.current}] Updated total donations for successful payment`);
            
            // Add donation to sequential queues for processing with delay (only successful payments will be processed)
            addDonationToQueues(newDonation);
          } catch (error) {
            console.error(`[${componentId.current}] Error processing new donation:`, error);
          }
        }
      )
      .subscribe();

    console.log(`[${componentId.current}] Real-time subscription set up for chiaa_gaming OBS overlay - SUCCESS PAYMENTS ONLY with ${ALERT_DELAY_MS/60000} minute delay: ${obsId}`);

    // Store cleanup function
    cleanupRef.current = () => {
      console.log(`[${componentId.current}] Component cleanup initiated`);
      supabase.removeChannel(channel);
      
      // Clear timeouts
      if (globalProcessingTimeout) {
        clearTimeout(globalProcessingTimeout);
        globalProcessingTimeout = null;
      }
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [obsId, showMessages]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log(`[${componentId.current}] Component unmounting, performing cleanup`);
      cleanupGlobalState();
    };
  }, []);

  const progressPercentage = Math.min((totalDonations / goalTarget) * 100, 100);
  const shouldHideDonationBox = currentDonation && (currentDonation.gif_url || currentDonation.voice_url);
  const shouldShowTextMessage = currentDonation && currentDonation.message && !currentDonation.voice_url;

  return (
    <ObsConfigProvider>
      <div className="w-screen h-screen bg-transparent overflow-hidden relative">
        {/* Voice Recording Alert */}
        {showMessages && currentVoiceAlert && (
          <DraggableResizableBox className="animate-slide-in-right">
            <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-blue-500/50 max-w-md">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-100 font-bold text-lg">{currentVoiceAlert.name}</span>
                <span className="text-blue-300 font-semibold">played voice message</span>
              </div>
            </div>
          </DraggableResizableBox>
        )}

        {/* Custom Sound Alert */}
        {showMessages && currentCustomSoundAlert && (
          <DraggableResizableBox className="animate-slide-in-right">
            <div className="bg-gradient-to-r from-orange-600/90 to-red-600/90 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-orange-500/50 max-w-md">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-orange-100 font-bold text-lg">{currentCustomSoundAlert.name}</span>
                <span className="text-orange-300 font-semibold">₹{Number(currentCustomSoundAlert.amount).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-orange-300 font-semibold">played custom sound</span>
              </div>
              {currentCustomSoundAlert.message && (
                <p className="text-orange-50 text-sm leading-relaxed">{currentCustomSoundAlert.message}</p>
              )}
            </div>
          </DraggableResizableBox>
        )}

        {/* GIF Alert */}
        {showMessages && currentGifAlert && (
          <DraggableResizableBox className="animate-slide-in-right">
            <div className="bg-gradient-to-r from-green-600/90 to-teal-600/90 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-green-500/50 max-w-md">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-100 font-bold text-lg">{currentGifAlert.name}</span>
                <span className="text-green-300 font-semibold">shared a GIF</span>
              </div>
            </div>
          </DraggableResizableBox>
        )}

        {/* Regular Donation Messages with Enhanced Animation */}
        {showMessages && currentDonation && !shouldHideDonationBox && (
          <DraggableResizableBox className="animate-slide-in-right">
            <div className="relative overflow-hidden bg-gradient-to-r from-pink-600/90 to-purple-600/90 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-pink-500/50 max-w-md">
              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-2 left-2 w-2 h-2 bg-pink-300 rounded-full animate-ping"></div>
                <div className="absolute top-4 right-4 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute bottom-3 left-6 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
              </div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              
              <div className="relative z-10 flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                <span className="text-pink-100 font-bold text-lg animate-pulse">{currentDonation.name}</span>
                <span className="text-pink-300 font-semibold bg-pink-500/20 px-2 py-1 rounded-full animate-bounce">₹{Number(currentDonation.amount).toLocaleString()}</span>
              </div>
              {shouldShowTextMessage && (
                <div className="relative">
                  <p className="text-pink-50 text-sm leading-relaxed animate-fade-in">{currentDonation.message}</p>
                  <div className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 animate-pulse rounded-full" style={{width: '100%'}}></div>
                </div>
              )}
            </div>
          </DraggableResizableBox>
        )}

        {/* Standalone GIF Display */}
        {currentGifAlert && currentGifAlert.gif_url && (
          <DraggableResizableBox className="animate-slide-in-right">
            <div className="flex justify-center">
              <img
                src={currentGifAlert.gif_url}
                alt="Donation GIF"
                className="max-w-full max-h-64 rounded-lg animate-scale-in"
                style={{ objectFit: 'contain' }}
                onLoad={() => {
                  console.log(`[${componentId.current}] GIF loaded successfully:`, currentGifAlert.gif_url);
                }}
                onError={(e) => {
                  console.error(`[${componentId.current}] Failed to load GIF:`, currentGifAlert.gif_url);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </DraggableResizableBox>
        )}

        {/* Goal Progress */}
        {showGoal && (
          <DraggableResizableBox className="animate-fade-in">
            <div className="bg-gradient-to-r from-pink-600/90 to-purple-600/90 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-pink-500/50 min-w-[300px]">
              <div className="text-center mb-4">
                <h3 className="text-pink-100 font-bold text-xl mb-2">{goalName}</h3>
                <div className="text-pink-200 text-lg">
                  ₹{totalDonations.toLocaleString()} / ₹{goalTarget.toLocaleString()}
                </div>
              </div>
              
              <div className="w-full bg-black/30 rounded-full h-6 mb-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-pink-400 to-purple-400 h-full rounded-full transition-all duration-1000 ease-out animate-pulse"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              
              <div className="text-center text-pink-200 text-sm">
                {progressPercentage.toFixed(1)}% Complete
              </div>
            </div>
          </DraggableResizableBox>
        )}
      </div>
    </ObsConfigProvider>
  );
};

export default ChiaaGamingObsOverlay;
