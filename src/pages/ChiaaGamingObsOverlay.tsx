
import React, { useEffect, useState } from "react";
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
  include_sound?: boolean;
  custom_sound_id?: string;
  custom_sound_name?: string;
  custom_sound_url?: string;
  payment_status: string;
}

const ChiaaGamingObsOverlay = () => {
  const { obsId } = useParams();
  const [searchParams] = useSearchParams();
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [totalDonations, setTotalDonations] = useState(0);
  
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
    goalTarget
  });

  // Function to play custom sound from donation data
  const playCustomSound = (donation: Donation) => {
    console.log("playCustomSound called with donation:", {
      id: donation.id,
      name: donation.name,
      custom_sound_url: donation.custom_sound_url,
      custom_sound_name: donation.custom_sound_name,
      custom_sound_id: donation.custom_sound_id
    });

    if (donation.custom_sound_url) {
      console.log("Playing custom sound:", donation.custom_sound_name, donation.custom_sound_url);
      
      try {
        const audio = new Audio(donation.custom_sound_url);
        audio.volume = 0.7; // Set volume to 70%
        
        audio.addEventListener('loadstart', () => {
          console.log("Audio loading started");
        });
        
        audio.addEventListener('canplaythrough', () => {
          console.log("Audio can play through");
        });
        
        audio.addEventListener('error', (e) => {
          console.error("Audio error:", e);
          console.error("Audio error details:", {
            error: e.error,
            src: audio.src,
            networkState: audio.networkState,
            readyState: audio.readyState
          });
        });
        
        audio.addEventListener('ended', () => {
          console.log("Custom sound playback ended");
        });

        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Custom sound started playing successfully");
            })
            .catch(error => {
              console.error("Failed to play custom sound:", error);
              console.error("Audio element details:", {
                src: audio.src,
                volume: audio.volume,
                muted: audio.muted,
                paused: audio.paused
              });
            });
        }
      } catch (error) {
        console.error("Error creating/playing audio:", error);
      }
    } else {
      console.log("No custom sound URL found in donation");
    }
  };

  // Clean up media after it's displayed
  const cleanupMedia = async (donationId: string, mediaUrl: string, mediaType: 'gif' | 'voice') => {
    try {
      console.log(`Cleaning up ${mediaType} for donation:`, donationId);
      
      // Mark media as displayed in the database
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

      // Extract file path from URL for deletion
      const urlParts = mediaUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('donation-gifs')
        .remove([fileName]);

      if (deleteError) {
        console.error(`Error deleting ${mediaType} file:`, deleteError);
      } else {
        console.log(`${mediaType} file deleted successfully:`, fileName);
      }

      // Mark as deleted in database
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

  useEffect(() => {
    // Fetch today's total donations for goal progress (only successful ones for goal)
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

    // Set up real-time subscription for new donations - SHOW ALERTS FOR ALL PAYMENTS for testing
    const channel = supabase
      .channel(`chiaa-gaming-obs-${obsId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chiaa_gaming_donations'
          // Removed filter to show all payments for testing
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log("New donation received in OBS overlay (testing mode - all payments):", newDonation);
          console.log("Payment status:", newDonation.payment_status);
          console.log("Donation has GIF URL:", newDonation.gif_url);
          console.log("Donation has Voice URL:", newDonation.voice_url);
          console.log("Donation custom sound details:", {
            custom_sound_id: newDonation.custom_sound_id,
            custom_sound_name: newDonation.custom_sound_name,
            custom_sound_url: newDonation.custom_sound_url,
            include_sound: newDonation.include_sound
          });
          
          // Only update goal total for successful payments
          if (newDonation.payment_status === "success") {
            setTotalDonations(prev => prev + Number(newDonation.amount));
          }
          
          // Show message for ALL donations (success AND failed) if enabled and has content to display
          if (showMessages && (newDonation.message || newDonation.gif_url || newDonation.voice_url || newDonation.custom_sound_url)) {
            setCurrentDonation(newDonation);
            
            // Play custom sound if present - this should happen immediately
            if (newDonation.custom_sound_url) {
              console.log("About to play custom sound for donation:", {
                id: newDonation.id,
                name: newDonation.custom_sound_name,
                url: newDonation.custom_sound_url
              });
              // Play sound immediately
              setTimeout(() => {
                playCustomSound(newDonation);
              }, 100); // Small delay to ensure DOM is ready
            }
            
            // Auto-hide after 12 seconds and cleanup media if present
            setTimeout(() => {
              if (newDonation.gif_url) {
                console.log("Cleaning up GIF after display:", newDonation.gif_url);
                cleanupMedia(newDonation.id, newDonation.gif_url, 'gif');
              }
              if (newDonation.voice_url) {
                console.log("Cleaning up Voice after display:", newDonation.voice_url);
                cleanupMedia(newDonation.id, newDonation.voice_url, 'voice');
              }
              setCurrentDonation(null);
            }, 12000);
          }
        }
      )
      .subscribe();

    console.log(`Real-time subscription set up for chiaa_gaming OBS overlay: ${obsId} (TESTING MODE - showing all payments)`);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [obsId, showMessages]);

  const progressPercentage = Math.min((totalDonations / goalTarget) * 100, 100);

  // Check if we should hide the donation box (when GIF or voice is present)
  const shouldHideDonationBox = currentDonation && (currentDonation.gif_url || currentDonation.voice_url);
  
  // Check if we should show text message (only if no voice message and no custom sound)
  const shouldShowTextMessage = currentDonation && currentDonation.message && !currentDonation.voice_url && !currentDonation.custom_sound_url;

  // Get border color based on payment status for testing visual feedback
  const getBorderColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-500/50';
      case 'failed':
        return 'border-red-500/50';
      case 'pending':
        return 'border-yellow-500/50';
      default:
        return 'border-pink-500/50';
    }
  };

  return (
    <ObsConfigProvider>
      <div className="w-screen h-screen bg-transparent overflow-hidden relative">
        {/* Donation Messages - Only show pink box if no GIF, voice, or custom sound */}
        {showMessages && currentDonation && !shouldHideDonationBox && !currentDonation.custom_sound_url && (
          <DraggableResizableBox className="animate-slide-in-right">
            <div className={`bg-gradient-to-r from-pink-600/90 to-purple-600/90 backdrop-blur-sm rounded-lg p-4 shadow-2xl border ${getBorderColor(currentDonation.payment_status)} max-w-md`}>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                <span className="text-pink-100 font-bold text-lg">{currentDonation.name}</span>
                <span className="text-pink-300 font-semibold">₹{Number(currentDonation.amount).toLocaleString()}</span>
                {/* Testing indicator */}
                <span className={`text-xs px-2 py-1 rounded ${
                  currentDonation.payment_status === 'success' ? 'bg-green-600' : 
                  currentDonation.payment_status === 'failed' ? 'bg-red-600' : 'bg-yellow-600'
                }`}>
                  {currentDonation.payment_status.toUpperCase()}
                </span>
              </div>
              {shouldShowTextMessage && (
                <p className="text-pink-50 text-sm leading-relaxed">{currentDonation.message}</p>
              )}
            </div>
          </DraggableResizableBox>
        )}

        {/* Custom Sound Alert Display - when custom sound is present */}
        {showMessages && currentDonation && currentDonation.custom_sound_url && !currentDonation.gif_url && !currentDonation.voice_url && (
          <DraggableResizableBox className="animate-slide-in-right">
            <div className={`bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-sm rounded-lg p-6 shadow-2xl border ${getBorderColor(currentDonation.payment_status)} max-w-md`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-purple-100 font-bold text-xl">{currentDonation.name}</span>
                <span className="text-purple-300 font-semibold text-lg">₹{Number(currentDonation.amount).toLocaleString()}</span>
                {/* Testing indicator */}
                <span className={`text-xs px-2 py-1 rounded ${
                  currentDonation.payment_status === 'success' ? 'bg-green-600' : 
                  currentDonation.payment_status === 'failed' ? 'bg-red-600' : 'bg-yellow-600'
                }`}>
                  {currentDonation.payment_status.toUpperCase()}
                </span>
              </div>
              <div className="text-center">
                <div className="text-purple-200 text-lg font-semibold mb-2">🔊 {currentDonation.custom_sound_name}!</div>
                <div className="text-purple-100 text-sm">Playing custom sound...</div>
                <div className="text-purple-300 text-xs mt-2">
                  Sound URL: {currentDonation.custom_sound_url?.substring(0, 50)}...
                </div>
              </div>
            </div>
          </DraggableResizableBox>
        )}

        {/* Standalone GIF Display - no pink box */}
        {currentDonation && currentDonation.gif_url && (
          <DraggableResizableBox className="animate-slide-in-right">
            <div className="flex justify-center">
              <img
                src={currentDonation.gif_url}
                alt="Donation GIF"
                className="max-w-full max-h-64 rounded-lg"
                style={{ objectFit: 'contain' }}
                onLoad={() => {
                  console.log("GIF loaded successfully:", currentDonation.gif_url);
                }}
                onError={(e) => {
                  console.error("Failed to load GIF:", currentDonation.gif_url);
                  console.error("Image error event:", e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </DraggableResizableBox>
        )}

        {/* Standalone Voice Audio Player - no pink box, auto-play */}
        {currentDonation && currentDonation.voice_url && (
          <div className="absolute top-4 left-4">
            <audio
              src={currentDonation.voice_url}
              autoPlay
              className="hidden"
              onLoad={() => {
                console.log("Voice audio loaded successfully:", currentDonation.voice_url);
              }}
              onError={(e) => {
                console.error("Failed to load voice audio:", currentDonation.voice_url);
                console.error("Audio error event:", e);
              }}
              onEnded={() => {
                console.log("Voice audio playback ended");
              }}
            />
          </div>
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
