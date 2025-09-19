import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const ChiaGamingDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        // Check if user has access to chia_gaming dashboard or is admin
        const { data } = await supabase.rpc('get_streamer_by_email', {
          user_email: user.email
        });

        const hasChiaAccess = data?.some((item: any) => 
          item.streamer_slug === 'chia_gaming' || item.streamer_slug === 'all' || item.is_admin === true
        );

        if (hasChiaAccess) {
          setHasAccess(true);
        } else {
          navigate('/dashboard'); // Redirect to main dashboard
        }
      } catch (error) {
        console.error('Error checking access:', error);
        navigate('/dashboard');
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, loading, navigate]);

  if (loading || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect
  }

  return (
    <StreamerDashboard
      streamerSlug="chia_gaming"
      streamerName="Chia Gaming"
      brandColor="#ec4899"
      tableName="chia_gaming_donations"
    />
  );
};

export default ChiaGamingDashboard;