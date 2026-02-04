import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StreamerDashboard from './StreamerDashboard';

interface StreamerDashboardWrapperProps {
  streamerSlug: string;
  streamerName: string;
  tableName: string;
  brandColor?: string;
}

const StreamerDashboardWrapper: React.FC<StreamerDashboardWrapperProps> = ({
  streamerSlug,
  streamerName,
  tableName,
  brandColor,
}) => {
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
        // Check if user has access to this streamer's dashboard or is admin
        const { data } = await supabase.rpc('get_user_streamers', {
          p_user_id: user.id,
          p_user_email: user.email
        });

        const hasStreamerAccess = data?.some((streamer: any) => 
          streamer.streamer_slug === streamerSlug || streamer.is_admin === true
        );

        if (hasStreamerAccess) {
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
  }, [user, loading, navigate, streamerSlug]);

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
      streamerSlug={streamerSlug}
      streamerName={streamerName}
      tableName={tableName}
      brandColor={brandColor}
    />
  );
};

export default StreamerDashboardWrapper;
