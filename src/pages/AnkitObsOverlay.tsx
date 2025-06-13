
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useObsConfig } from "@/contexts/ObsConfigContext";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const AnkitObsOverlay = () => {
  const { obsId } = useParams();
  const [searchParams] = useSearchParams();
  const showMessages = searchParams.get('showMessages') !== 'false';
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { obsConfig } = useObsConfig();

  useEffect(() => {
    // Set up real-time subscription for new donations
    const channel = supabase
      .channel(`ankit-obs-overlay-${obsId}`)
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
          console.log('New donation received in OBS overlay:', newDonation);
          
          // Show the donation alert
          setCurrentDonation(newDonation);
          setIsVisible(true);
          
          // Hide after 15 seconds
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => setCurrentDonation(null), 500); // Clear after fade out
          }, 15000);
        }
      )
      .subscribe();

    console.log('OBS overlay real-time subscription set up');

    return () => {
      supabase.removeChannel(channel);
    };
  }, [obsId]);

  if (!currentDonation) {
    return (
      <div className="w-full h-full bg-transparent">
        {/* Empty state - transparent background for OBS */}
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 pointer-events-none ${obsConfig.isDraggable ? 'pointer-events-auto' : ''}`}
      style={{ background: 'transparent' }}
    >
      <div 
        className={`
          ${obsConfig.isDraggable ? 'resize border-2 border-dashed border-blue-500' : ''}
          absolute top-4 right-4 w-96 max-w-md
          transition-all duration-500 ease-in-out
          ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        `}
        style={{
          resize: obsConfig.isDraggable ? 'both' : 'none',
          overflow: obsConfig.isDraggable ? 'auto' : 'visible'
        }}
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-2xl p-6 text-white animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">New Donation!</h3>
            <div className="text-3xl">🎉</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{currentDonation.name}</span>
              <span className="text-2xl font-bold text-yellow-300">
                ₹{Number(currentDonation.amount).toLocaleString()}
              </span>
            </div>
            
            {showMessages && currentDonation.message && (
              <div className="bg-black/20 rounded-md p-3">
                <p className="text-sm italic">"{currentDonation.message}"</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <div className="inline-block bg-white/20 rounded-full px-4 py-1 text-sm">
              Thank you for your support! ❤️
            </div>
          </div>
        </div>
      </div>
      
      {obsConfig.isDraggable && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">
          Edit Mode: Drag & Resize
        </div>
      )}
    </div>
  );
};

export default AnkitObsOverlay;
