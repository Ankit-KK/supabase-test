import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const DemoStreamerDashboard = () => {
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
        // Check if user has access to demostreamer dashboard or is admin
        const { data } = await supabase.rpc('get_streamer_by_email', {
          user_email: user.email
        });

        const hasDemoAccess = data?.some((item: any) => 
          item.streamer_slug === 'demostreamer' || item.streamer_slug === 'all' || item.is_admin === true
        );

        if (hasDemoAccess) {
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
      streamerSlug="demostreamer"
      streamerName="Demo Streamer"
      brandColor="#6366f1"
      tableName="demostreamer_donations"
    />
  );
};

export default DemoStreamerDashboard;