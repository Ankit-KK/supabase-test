
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
  gif_url?: string;
  voice_url?: string;
  custom_sound_url?: string;
}

// Global queues for sequential processing
const globalMessageQueue: Donation[] = [];
const globalGifQueue: { donation: Donation; duration: number }[] = [];
const globalCustomSoundQueue: { donation: Donation; audioElement: HTMLAudioElement }[] = [];
const globalVoiceQueue: { donation: Donation; audioElement: HTMLAudioElement; duration: number }[] = [];

// Global processing states
let isProcessingMessages = false;
let isProcessingGifs = false;
let isProcessingCustomSounds = false;
let isProcessingVoiceRecordings = false;

let globalProcessingTimeout: NodeJS.Timeout | null = null;
const processedDonationIds = new Set<string>();

const ChiaaGamingObsOverlay = () => {
  const { obsId } = useParams();
  const [searchParams] = useSearchParams();
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [currentCustomSoundAlert, setCurrentCustomSoundAlert] = useState<Donation | null>(null);
  const [currentVoiceAlert, setCurrentVoiceAlert] = useState<Donation | null>(null);
  const [currentGifAlert, setCurrentGifAlert] = useState<Donation | null>(null);
  const [totalDonations, setTotalDonations] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  
  // Use ref to track if this component instance is the active processor
  const isActiveProcessor = useRef(false);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));
  
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
    componentId: componentId.current
  });

  // Clean up media after it's displayed
  const cleanupMedia = async (donationId: string, mediaUrl: string, mediaType: 'gif' | 'voice') => {
    try {
      console.log(`Cleaning up ${mediaType} for donation:`, donationId);
      
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

      const urlParts = mediaUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      const { error: deleteError } = await supabase.storage
        .from('donation-gifs')
        .remove([fileName]);

      if (deleteError) {
        console.error(`Error deleting ${mediaType} file:`, deleteError);
      } else {
        console.log(`${mediaType} file deleted successfully:`, fileName);
      }

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

    } catch (error) {
      console.error(`Error in cleanup${mediaType}:`, error);
    }
  };

  // Process message queue (highest priority)
  const processNextMessage = () => {
    if (globalMessageQueue.length === 0) {
      isProcessingMessages = false;
      // Start GIF processing after messages are done
      processNextGif();
      return;
    }

    if (isProcessingMessages) {
      return;
    }

    isProcessingMessages = true;
    const nextDonation = globalMessageQueue.shift();
    
    if (!nextDonation) {
      isProcessingMessages = false;
      processNextGif();
      return;
    }

    console.log(`[${componentId.current}] Processing message from queue:`, nextDonation.id, nextDonation.name);
    
    // Update all component instances with the new queue length
    setQueueLength(globalMessageQueue.length + globalGifQueue.length + globalCustomSoundQueue.length + globalVoiceQueue.length);
    
    // Mark this donation as processed
    processedDonationIds.add(nextDonation.id);
    
    // Show the donation on all component instances
    setCurrentDonation(nextDonation);

    // Auto-hide after 12 seconds
    const hideTimeout = setTimeout(() => {
      console.log(`[${componentId.current}] Hiding message after 12 seconds:`, nextDonation.id);
      
      setCurrentDonation(null);
      isProcessingMessages = false;
      
      // Process next message after 3 seconds
      globalProcessingTimeout = setTimeout(() => {
        processNextMessage();
      }, 3000);
    }, 12000);
  };

  // Process GIF queue (second priority)
  const processNextGif = () => {
    if (globalGifQueue.length === 0) {
      isProcessingGifs = false;
      // Start sound processing after GIFs are done
      processNextCustomSound();
      return;
    }

    if (isProcessingGifs) {
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
    
    console.log(`[${componentId.current}] Showing GIF alert:`, donation.name, `Duration: ${duration}ms`);
    
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

  // Process custom sound queue (third priority)
  const processNextCustomSound = () => {
    if (globalCustomSoundQueue.length === 0) {
      isProcessingCustomSounds = false;
      // Start voice processing after custom sounds are done
      processNextVoiceRecording();
      return;
    }

    if (isProcessingCustomSounds) {
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
    
    console.log(`[${componentId.current}] Playing custom sound and showing alert:`, donation.name);
    
    // Show the custom sound alert
    setCurrentCustomSoundAlert(donation);
    
    audioElement.onended = () => {
      console.log(`[${componentId.current}] Custom sound ended, hiding alert`);
      setCurrentCustomSoundAlert(null);
      isProcessingCustomSounds = false;
      
      // Process next sound after a short delay
      setTimeout(() => {
        processNextCustomSound();
      }, 500);
    };
    
    audioElement.onerror = (e) => {
      console.error(`[${componentId.current}] Failed to play custom sound:`, e);
      setCurrentCustomSoundAlert(null);
      isProcessingCustomSounds = false;
      
      // Process next sound even on error
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

  // Process voice recording queue (lowest priority)
  const processNextVoiceRecording = () => {
    if (globalVoiceQueue.length === 0) {
      isProcessingVoiceRecordings = false;
      return;
    }

    if (isProcessingVoiceRecordings) {
      return;
    }

    isProcessingVoiceRecordings = true;
    const voiceItem = globalVoiceQueue.shift();
    
    if (!voiceItem) {
      isProcessingVoiceRecordings = false;
      return;
    }

    const { donation, audioElement, duration } = voiceItem;
    
    console.log(`[${componentId.current}] Playing voice recording and showing alert:`, donation.name, `Duration: ${duration}ms`);
    
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
      
      // Process next voice recording after a short delay
      setTimeout(() => {
        processNextVoiceRecording();
      }, 500);
    };
    
    audioElement.onerror = (e) => {
      console.error(`[${componentId.current}] Failed to play voice recording:`, e);
      setCurrentVoiceAlert(null);
      isProcessingVoiceRecordings = false;
      
      // Process next voice recording even on error
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
      if (originalOnEnded) originalOnEnded();
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

  // Add donation to queues in priority order: messages first, then GIFs, then sounds
  const addDonationToQueues = (donation: Donation) => {
    console.log(`[${componentId.current}] Processing donation with sequential priority:`, {
      donationId: donation.id,
      name: donation.name,
      hasCustomSound: !!donation.custom_sound_url,
      hasVoice: !!donation.voice_url,
      hasGif: !!donation.gif_url,
      hasMessage: !!donation.message,
      amount: donation.amount
    });

    // 1. ALWAYS add message to queue first if messages are enabled and has text message content
    if (showMessages && donation.message && donation.message.trim()) {
      console.log(`[${componentId.current}] Adding message to donation queue for donation:`, donation.id);
      globalMessageQueue.push(donation);
    }

    // 2. Add GIF to queue (will be processed after messages)
    if (donation.gif_url) {
      console.log(`[${componentId.current}] Adding GIF to queue for donation:`, donation.id);
      const duration = 12000; // 12 seconds for GIFs
      globalGifQueue.push({ donation, duration });
    }

    // 3. Add custom sound to queue (will be processed after GIFs)
    if (donation.custom_sound_url && Number(donation.amount) >= 100) {
      console.log(`[${componentId.current}] Adding custom sound to queue for donation:`, donation.id);
      const audio = new Audio(donation.custom_sound_url);
      audio.volume = 0.7;
      audio.preload = 'auto';
      globalCustomSoundQueue.push({ donation, audioElement: audio });
    }

    // 4. Add voice recording to queue (will be processed after custom sounds)
    if (donation.voice_url && Number(donation.amount) >= 100) {
      console.log(`[${componentId.current}] Adding voice recording to queue for donation:`, donation.id);
      const audio = new Audio(donation.voice_url);
      audio.volume = 0.8;
      audio.preload = 'auto';
      const duration = Number(donation.amount) < 150 ? 30000 : 60000; // 30s or 60s
      globalVoiceQueue.push({ donation, audioElement: audio, duration });
    }

    // Update queue length display
    setQueueLength(globalMessageQueue.length + globalGifQueue.length + globalCustomSoundQueue.length + globalVoiceQueue.length);
    
    console.log(`[${componentId.current}] Updated queue lengths:`, {
      messages: globalMessageQueue.length,
      gifs: globalGifQueue.length,
      customSounds: globalCustomSoundQueue.length,
      voice: globalVoiceQueue.length,
      total: globalMessageQueue.length + globalGifQueue.length + globalCustomSoundQueue.length + globalVoiceQueue.length
    });

    // Start processing if not already processing (messages have highest priority)
    if (!isProcessingMessages && !isProcessingGifs && !isProcessingCustomSounds && !isProcessingVoiceRecordings) {
      console.log(`[${componentId.current}] Starting sequential queue processing`);
      setTimeout(() => {
        processNextMessage();
      }, 100);
    }

    // Mark as processed to avoid duplicate processing
    processedDonationIds.add(donation.id);
  };

  useEffect(() => {
    // Fetch today's total donations for goal progress
    const fetchTotalDonations = async () => {
      const today = new Date();
      const todayStart = `${today.toISOString().split('T')[0]}T00:00:00`;
      const todayEnd = `${today.toISOString().split('T')[0]}T23:59:59`;
      
      const { data } = await supabase
        .from("chiaa_gaming_donations")
        .select("amount")
        .eq("payment_status", "success")
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd);

      if (data) {
        const total = data.reduce((sum, donation) => sum + Number(donation.amount), 0);
        setTotalDonations(total);
      }
    };

    fetchTotalDonations();

    // Set queue length from global state
    setQueueLength(globalMessageQueue.length + globalGifQueue.length + globalCustomSoundQueue.length + globalVoiceQueue.length);

    // Set up real-time subscription for new donations
    const channel = supabase
      .channel(`chiaa-gaming-obs-${obsId}-${componentId.current}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chiaa_gaming_donations'
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log(`[${componentId.current}] New donation received in OBS overlay:`, newDonation.id, newDonation.name);
          
          // Update total for goal only if payment is successful
          if ((payload.new as any).payment_status === "success") {
            setTotalDonations(prev => prev + Number(newDonation.amount));
          }
          
          // Add donation to sequential queues for processing
          addDonationToQueues(newDonation);
        }
      )
      .subscribe();

    console.log(`[${componentId.current}] Real-time subscription set up for chiaa_gaming OBS overlay: ${obsId}`);

    return () => {
      console.log(`[${componentId.current}] Component unmounting, cleaning up`);
      supabase.removeChannel(channel);
      
      // Clear timeouts if this was the active processor
      if (globalProcessingTimeout) {
        clearTimeout(globalProcessingTimeout);
        globalProcessingTimeout = null;
      }
    };
  }, [obsId, showMessages]);

  const progressPercentage = Math.min((totalDonations / goalTarget) * 100, 100);
  const shouldHideDonationBox = currentDonation && (currentDonation.gif_url || currentDonation.voice_url);
  const shouldShowTextMessage = currentDonation && currentDonation.message && !currentDonation.voice_url;

  return (
    <ObsConfigProvider>
      <div className="w-screen h-screen bg-transparent overflow-hidden relative">
        {/* Global Queue Status Indicator */}
        {(globalMessageQueue.length > 0 || globalCustomSoundQueue.length > 0 || globalVoiceQueue.length > 0 || globalGifQueue.length > 0) && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-50">
            Queue: M:{globalMessageQueue.length} | G:{globalGifQueue.length} | CS:{globalCustomSoundQueue.length} | V:{globalVoiceQueue.length} | Processing: {isProcessingMessages || isProcessingGifs || isProcessingCustomSounds || isProcessingVoiceRecordings ? 'Yes' : 'No'} | ID: {componentId.current.substr(0, 4)}
          </div>
        )}

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
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-orange-100 font-bold text-lg">{currentCustomSoundAlert.name}</span>
                <span className="text-orange-300 font-semibold">played custom voice</span>
              </div>
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

        {/* Regular Donation Messages */}
        {showMessages && currentDonation && !shouldHideDonationBox && (
          <DraggableResizableBox className="animate-slide-in-right">
            <div className="bg-gradient-to-r from-pink-600/90 to-purple-600/90 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-pink-500/50 max-w-md">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                <span className="text-pink-100 font-bold text-lg">{currentDonation.name}</span>
                <span className="text-pink-300 font-semibold">₹{Number(currentDonation.amount).toLocaleString()}</span>
              </div>
              {shouldShowTextMessage && (
                <p className="text-pink-50 text-sm leading-relaxed">{currentDonation.message}</p>
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
                className="max-w-full max-h-64 rounded-lg"
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
                  className="bg-gradient-to-r from-pink-400 to-purple-400 h-full rounded-full transition-all duration-1000 ease-out"
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
