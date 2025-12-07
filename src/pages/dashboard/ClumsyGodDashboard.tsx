import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const ClumsyGodDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate(`/auth?redirect=${window.location.pathname}`);
        return;
      }

      try {
        const { data } = await supabase.rpc('get_user_streamers', {
          p_user_id: user.id
        });

        const hasClumsyGodAccess = data?.some((streamer: any) => 
          streamer.streamer_slug === 'clumsygod' || streamer.is_admin === true
        );

        if (hasClumsyGodAccess) {
          setHasAccess(true);
        } else {
          navigate('/dashboard');
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
    return null;
  }

  return (
    <StreamerDashboard
      streamerSlug="clumsygod"
      streamerName="ClumsyGod"
      brandColor="#ef4444"
      tableName="clumsygod_donations"
    />
  );
};

export default ClumsyGodDashboard;