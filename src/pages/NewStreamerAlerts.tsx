import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Sparkles, Mic, Volume2 } from 'lucide-react';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string | null;
  voice_message_url: string | null;
  voice_duration_seconds: number | null;
  is_hyperemote: boolean;
  approved_at: string;
  created_at: string;
  payment_status: string;
  moderation_status: string;
}

interface StreamerInfo {
  id: string;
  streamer_name: string;
  brand_color: string;
  brand_logo_url: string | null;
}

const NewStreamerAlerts: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [streamerInfo, setStreamerInfo] = useState<StreamerInfo | null>(null);
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      validateTokenAndFetchData();
      setupRealtimeSubscription();
    }
  }, [token]);

  const validateTokenAndFetchData = async () => {
    try {
      // For demo purposes, we'll accept any token
      // In production, this would validate against the obs_tokens table
      setIsValid(true);

      // Fetch streamer info
      const { data: streamerData, error: streamerError } = await supabase
        .from('streamers')
        .select('id, streamer_name, brand_color, brand_logo_url')
        .eq('streamer_slug', 'newstreamer')
        .single();

      if (streamerError) throw streamerError;
      setStreamerInfo(streamerData);

      // Fetch recent approved donations
      const { data: donationsData, error: donationsError } = await supabase
        .from('newstreamer_donations')
        .select('*')
        .eq('streamer_id', streamerData.id)
        .eq('moderation_status', 'approved')
        .eq('payment_status', 'paid')
        .order('approved_at', { ascending: false })
        .limit(50);

      if (donationsError) throw donationsError;
      setDonations(donationsData || []);

    } catch (error) {
      console.error('Error validating token or fetching data:', error);
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('newstreamer_alerts_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'newstreamer_donations',
          filter: 'moderation_status=eq.approved'
        },
        (payload) => {
          const updatedDonation = payload.new as Donation;
          
          if (updatedDonation.payment_status === 'paid' && updatedDonation.moderation_status === 'approved') {
            // Add to donations list
            setDonations(prev => [updatedDonation, ...prev.slice(0, 49)]);
            
            // Show alert
            setCurrentAlert(updatedDonation);
            
            // Hide alert after 10 seconds
            setTimeout(() => {
              setCurrentAlert(null);
            }, 10000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const playVoiceMessage = async (voiceUrl: string) => {
    try {
      const audio = new Audio(voiceUrl);
      audio.volume = 0.7;
      await audio.play();
    } catch (error) {
      console.error('Error playing voice message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Token</h2>
            <p className="text-muted-foreground">
              This alert URL is not valid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Current Alert Display */}
      {currentAlert && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <Card 
            className="max-w-lg mx-4 border-2 shadow-2xl animate-scale-in backdrop-blur-sm"
            style={{ 
              borderColor: streamerInfo?.brand_color || '#10b981',
              backgroundColor: 'rgba(255, 255, 255, 0.95)'
            }}
          >
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  {currentAlert.is_hyperemote ? (
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  ) : (
                    <div 
                      className="p-4 rounded-full"
                      style={{ backgroundColor: streamerInfo?.brand_color || '#10b981' }}
                    >
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {currentAlert.is_hyperemote ? 'HYPEREMOTE!' : 'NEW DONATION!'}
                  </h2>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl font-semibold">{currentAlert.name}</span>
                      <Badge 
                        className="text-lg px-3 py-1"
                        style={{ 
                          backgroundColor: streamerInfo?.brand_color || '#10b981',
                          color: 'white'
                        }}
                      >
                        ₹{currentAlert.amount}
                      </Badge>
                    </div>

                    {currentAlert.message && (
                      <p className="text-lg text-gray-700 max-w-md mx-auto">
                        "{currentAlert.message}"
                      </p>
                    )}

                    {/* Voice Message Button */}
                    {currentAlert.voice_message_url && (
                      <div className="pt-2">
                        <button
                          onClick={() => playVoiceMessage(currentAlert.voice_message_url!)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors pointer-events-auto"
                        >
                          <Volume2 className="w-4 h-4" />
                          Play Voice Message
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thank you message */}
                <p className="text-sm text-gray-600">
                  Thank you for supporting {streamerInfo?.streamer_name}!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Donations List (for OBS overlay) */}
      <div className="fixed top-4 right-4 space-y-2 max-w-sm">
        {donations.slice(0, 5).map((donation, index) => (
          <Card 
            key={donation.id}
            className={`backdrop-blur-sm bg-white/80 border transition-all duration-300 ${
              index === 0 ? 'animate-fade-in' : ''
            }`}
            style={{ 
              borderLeftColor: streamerInfo?.brand_color || '#10b981',
              borderLeftWidth: '4px'
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{donation.name}</span>
                  {donation.is_hyperemote && (
                    <Sparkles className="w-3 h-3 text-purple-500" />
                  )}
                  {donation.voice_message_url && (
                    <Mic className="w-3 h-3 text-blue-500" />
                  )}
                </div>
                <Badge 
                  variant="secondary"
                  style={{
                    backgroundColor: `${streamerInfo?.brand_color || '#10b981'}20`,
                    color: streamerInfo?.brand_color || '#10b981'
                  }}
                >
                  ₹{donation.amount}
                </Badge>
              </div>
              {donation.message && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {donation.message}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Streamer Branding */}
      {streamerInfo && (
        <div className="fixed bottom-4 left-4">
          <div 
            className="px-4 py-2 rounded-full backdrop-blur-sm text-white font-medium"
            style={{ backgroundColor: `${streamerInfo.brand_color}80` }}
          >
            {streamerInfo.streamer_name} - Live Donations
          </div>
        </div>
      )}
    </div>
  );
};

export default NewStreamerAlerts;