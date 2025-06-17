
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

// Global queue and processing state to persist across component remounts
const globalDonationQueue: Donation[] = [];
let isGloballyProcessing = false;
let globalProcessingTimeout: NodeJS.Timeout | null = null;
const processedDonationIds = new Set<string>();

// Global custom sound queue and processing
const globalCustomSoundQueue: { donation: Donation; audioElement: HTMLAudioElement }[] = [];
let isProcessingCustomSounds = false;

// Global voice recording queue and processing
const globalVoiceQueue: { donation: Donation; audioElement: HTMLAudioElement; duration: number }[] = [];
let isProcessingVoiceRecordings = false;

// Global GIF queue and processing
const globalGifQueue: { donation: Donation; duration: number }[] = [];
let isProcessingGifs = false;

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

  // Process GIF queue with synchronized alerts
  const processNextGif = () => {
    if (globalGifQueue.length === 0) {
      isProcessingGifs = false;
      return;
    }

    if (isProcessingGifs) {
      return;
    }

    isProcessingGifs = true;
    const gifItem = globalGifQueue.shift();
    
    if (!gifItem) {
      isProcessingGifs = false;
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

  // Add GIF to queue with calculated duration
  const addGifToQueue = (donation: Donation, gifUrl: string) => {
    console.log(`[${componentId.current}] Adding GIF to queue:`, donation.name, gifUrl);
    
    // Calculate duration: 12 seconds for GIFs
    const duration = 12000;
    
    globalGifQueue.push({ donation, duration });
    
    // Start processing if not already processing
    if (!isProcessingGifs) {
      setTimeout(() => {
        processNextGif();
      }, 100);
    }
  };

  // Process voice recording queue with synchronized alerts
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

  // Add voice recording to queue with pre-loaded audio and calculated duration
  const addVoiceRecordingToQueue = (donation: Donation, voiceUrl: string) => {
    console.log(`[${componentId.current}] Adding voice recording to queue:`, donation.name, voiceUrl);
    
    const audio = new Audio(voiceUrl);
    audio.volume = 0.8;
    audio.preload = 'auto';
    
    // Calculate duration based on donation amount
    const duration = Number(donation.amount) < 150 ? 30000 : 60000; // 30s or 60s
    
    globalVoiceQueue.push({ donation, audioElement: audio, duration });
    
    // Start processing if not already processing
    if (!isProcessingVoiceRecordings) {
      setTimeout(() => {
        processNextVoiceRecording();
      }, 100);
    }
  };

  // Process custom sound queue with synchronized alerts
  const processNextCustomSound = () => {
    if (globalCustomSoundQueue.length === 0) {
      isProcessingCustomSounds = false;
      return;
    }

    if (isProcessingCustomSounds) {
      return;
    }

    isProcessingCustomSounds = true;
    const soundItem = globalCustomSoundQueue.shift();
    
    if (!soundItem) {
      isProcessingCustomSounds = false;
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

  // Add custom sound to queue with pre-loaded audio
  const addCustomSoundToQueue = (donation: Donation, soundUrl: string) => {
    console.log(`[${componentId.current}] Adding custom sound to queue:`, donation.name, soundUrl);
    
    const audio = new Audio(soundUrl);
    audio.volume = 0.7;
    audio.preload = 'auto';
    
    globalCustomSoundQueue.push({ donation, audioElement: audio });
    
    // Start processing if not already processing
    if (!isProcessingCustomSounds) {
      setTimeout(() => {
        processNextCustomSound();
      }, 100);
    }
  };

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

  // Global queue processor that works across component instances
  const processNextDonation = () => {
    console.log(`[${componentId.current}] processNext called, global queue length:`, globalDonationQueue.length);
    
    if (globalDonationQueue.length === 0) {
      console.log(`[${componentId.current}] Global queue is empty, stopping processing`);
      isGloballyProcessing = false;
      return;
    }

    if (isGloballyProcessing) {
      console.log(`[${componentId.current}] Already processing globally, skipping`);
      return;
    }

    isGloballyProcessing = true;
    const nextDonation = globalDonationQueue.shift();
    
    if (!nextDonation) {
      isGloballyProcessing = false;
      return;
    }

    console.log(`[${componentId.current}] Processing donation from global queue:`, nextDonation.id, nextDonation.name);
    console.log(`[${componentId.current}] Global queue after removing donation:`, globalDonationQueue.length);
    
    // Update all component instances with the new queue length
    setQueueLength(globalDonationQueue.length);
    
    // Mark this donation as processed
    processedDonationIds.add(nextDonation.id);
    
    // Show the donation on all component instances
    setCurrentDonation(nextDonation);

    // Auto-hide after 12 seconds and cleanup media if present
    const hideTimeout = setTimeout(() => {
      console.log(`[${componentId.current}] Hiding donation after 12 seconds:`, nextDonation.id);
      
      setCurrentDonation(null);
      isGloballyProcessing = false;
      
      // Process next donation after 3 seconds
      globalProcessingTimeout = setTimeout(() => {
        processNextDonation();
      }, 3000);
    }, 12000);
  };

  // Add donation to global queue
  const addDonationToGlobalQueue = (donation: Donation) => {
    // Check if this donation was already processed
    if (processedDonationIds.has(donation.id)) {
      console.log(`[${componentId.current}] Donation already processed, skipping:`, donation.id);
      return;
    }

    console.log(`[${componentId.current}] Adding donation to global queue:`, donation.id, donation.name);
    
    // Handle custom sound immediately if present - add to sound queue instead of donation queue
    if (donation.custom_sound_url && Number(donation.amount) >= 100) {
      console.log(`[${componentId.current}] Adding custom sound to queue for donation:`, {
        customSoundUrl: donation.custom_sound_url,
        amount: donation.amount,
        donationId: donation.id
      });
      addCustomSoundToQueue(donation, donation.custom_sound_url);
      return; // Don't add to regular donation queue if it has custom sound
    }

    // Handle voice recording immediately if present - add to voice queue instead of donation queue
    if (donation.voice_url && Number(donation.amount) >= 100) {
      console.log(`[${componentId.current}] Adding voice recording to queue for donation:`, {
        voiceUrl: donation.voice_url,
        amount: donation.amount,
        donationId: donation.id
      });
      addVoiceRecordingToQueue(donation, donation.voice_url);
      return; // Don't add to regular donation queue if it has voice recording
    }

    // Handle GIF immediately if present - add to GIF queue instead of donation queue
    if (donation.gif_url) {
      console.log(`[${componentId.current}] Adding GIF to queue for donation:`, {
        gifUrl: donation.gif_url,
        amount: donation.amount,
        donationId: donation.id
      });
      addGifToQueue(donation, donation.gif_url);
      return; // Don't add to regular donation queue if it has GIF
    }

    // Add to message queue if messages are enabled and has text message content to show
    if (showMessages && donation.message) {
      globalDonationQueue.push(donation);
      setQueueLength(globalDonationQueue.length);
      console.log(`[${componentId.current}] Donation added to global queue. New queue length:`, globalDonationQueue.length);
      
      // Start processing if not already processing
      if (!isGloballyProcessing) {
        console.log(`[${componentId.current}] Starting global queue processing`);
        setTimeout(() => {
          processNextDonation();
        }, 100);
      }
    }
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
    setQueueLength(globalDonationQueue.length);

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
          
          // Add donation to global queue for processing
          addDonationToGlobalQueue(newDonation);
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
        {(queueLength > 0 || globalCustomSoundQueue.length > 0 || globalVoiceQueue.length > 0 || globalGifQueue.length > 0) && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-50">
            Queue: {queueLength} | Processing: {isGloballyProcessing ? 'Yes' : 'No'} | Sounds: {globalCustomSoundQueue.length} | Voice: {globalVoiceQueue.length} | GIFs: {globalGifQueue.length} | ID: {componentId.current.substr(0, 4)}
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
