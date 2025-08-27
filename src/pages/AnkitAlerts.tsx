import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/dashboardUtils';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string | null;
  voice_message_url?: string | null;
  moderation_status: string;
  created_at: string;
  is_hyperemote?: boolean | null;
  payment_status?: string | null;
}

interface Streamer {
  id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  brand_logo_url?: string;
}

const AnkitAlerts = () => {
  const { token } = useParams<{ token: string }>();
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No OBS token provided');
        setLoading(false);
        return;
      }

      try {
        // Validate OBS token and get streamer info
        const { data, error } = await supabase
          .rpc('validate_obs_token_secure', { token_to_check: token });

        if (error || !data || data.length === 0 || !data[0].is_valid) {
          setError('Invalid or expired OBS token');
          setLoading(false);
          return;
        }

        const tokenData = data[0];
        
        // Verify this is for ankit
        if (tokenData.streamer_slug !== 'ankit') {
          setError('This token is not valid for Ankit');
          setLoading(false);
          return;
        }

        setStreamer({
          id: tokenData.streamer_id,
          streamer_slug: tokenData.streamer_slug,
          streamer_name: tokenData.streamer_name,
          brand_color: tokenData.brand_color,
          brand_logo_url: tokenData.brand_logo_url
        });
        
        setIsValid(true);
        setLoading(false);

        // Fetch recent donations
        const { data: donationsData, error: donationsError } = await supabase
          .from('ankit_donations')
          .select('*')
          .eq('streamer_id', tokenData.streamer_id)
          .eq('payment_status', 'success')
          .in('moderation_status', ['approved', 'auto_approved'])
          .eq('message_visible', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!donationsError && donationsData) {
          setRecentDonations(donationsData);
        }

      } catch (err) {
        console.error('Error validating token:', err);
        setError('Failed to validate OBS token');
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  useEffect(() => {
    if (!isValid || !streamer) return;

    // Set up realtime subscription for new donations
    const channel = supabase
      .channel(`ankit-alerts-${streamer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ankit_donations',
          filter: `streamer_id=eq.${streamer.id}`
        },
        (payload) => {
          console.log('Realtime alert update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const donation = payload.new as Donation;
            
            // Show alert for approved donations with successful payments
            if (donation.payment_status === 'success' && 
                (donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved') &&
                donation.message_visible) {
              
              // Update recent donations list
              setRecentDonations(prev => {
                const exists = prev.some(d => d.id === donation.id);
                const updated = exists 
                  ? prev.map(d => d.id === donation.id ? donation : d)
                  : [donation, ...prev];
                return updated.slice(0, 10); // Keep only last 10
              });

              // Show alert animation
              setCurrentAlert(donation);
              
              // Clear alert after animation duration
              setTimeout(() => {
                setCurrentAlert(null);
              }, 6000); // Show for 6 seconds
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isValid, streamer?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-2">OBS Alert Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!streamer) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white">Loading streamer data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Main Alert Animation */}
      {currentAlert && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          style={{ 
            '--brand-color': streamer.brand_color,
          } as React.CSSProperties}
        >
          <div className="animate-[bounceIn_0.8s_ease-out,fadeOut_1s_ease-in_5s_forwards] transform">
            <Card className="bg-gradient-to-r from-primary/90 to-primary-foreground/90 backdrop-blur-sm border-2 shadow-2xl max-w-md">
              <CardContent className="p-6 text-center">
                {/* Hyperemote Effect */}
                {currentAlert.is_hyperemote && (
                  <div className="mb-4">
                    <div className="text-6xl animate-bounce">🎉</div>
                    <div className="text-yellow-400 font-bold text-lg animate-pulse">
                      HYPEREMOTE!
                    </div>
                  </div>
                )}

                {/* Donation Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl">💝</div>
                    <h2 className="text-xl font-bold text-white">
                      New Donation!
                    </h2>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-white">
                      <span className="font-semibold">{currentAlert.name}</span> donated
                    </div>
                    
                    <div className="text-3xl font-bold text-yellow-400">
                      {formatCurrency(Number(currentAlert.amount))}
                    </div>
                    
                    {currentAlert.message && (
                      <div className="text-white/90 text-sm italic border-t pt-2 mt-2">
                        "{currentAlert.message}"
                      </div>
                    )}

                    {currentAlert.voice_message_url && (
                      <Badge variant="secondary" className="text-xs">
                        🎤 Voice Message
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Sparkle Effects */}
                <div className="absolute -top-2 -left-2 text-yellow-400 animate-ping">✨</div>
                <div className="absolute -top-2 -right-2 text-yellow-400 animate-ping animation-delay-300">✨</div>
                <div className="absolute -bottom-2 -left-2 text-yellow-400 animate-ping animation-delay-150">✨</div>
                <div className="absolute -bottom-2 -right-2 text-yellow-400 animate-ping animation-delay-450">✨</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Background Particles Effect */}
      {currentAlert && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-[float_3s_ease-in-out_infinite] opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${Math.random() * 20 + 10}px`,
              }}
            >
              {['🎉', '✨', '💝', '🎊', '⭐'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Status Indicator (always visible, small) */}
      <div className="fixed top-4 right-4 z-30">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white text-xs font-medium">
            Ankit Alerts • Live
          </span>
        </div>
      </div>

      {/* Recent Donations Ticker (Optional - only shows when no active alert) */}
      {!currentAlert && recentDonations.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-20">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2">
            <div className="text-white/70 text-xs text-center">
              Recent: {recentDonations.slice(0, 3).map(d => 
                `${d.name} (${formatCurrency(Number(d.amount))})`
              ).join(' • ')}
            </div>
          </div>
        </div>
      )}

      {/* Voice Message Player */}
      {currentAlert?.voice_message_url && (
        <audio
          autoPlay
          className="hidden"
          onEnded={() => console.log('Voice message finished')}
        >
          <source src={currentAlert.voice_message_url} type="audio/webm" />
          <source src={currentAlert.voice_message_url} type="audio/mpeg" />
        </audio>
      )}
    </div>
  );
};

export default AnkitAlerts;