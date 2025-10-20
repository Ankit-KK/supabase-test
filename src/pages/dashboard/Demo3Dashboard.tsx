import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const Demo3Dashboard = () => {
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
        const { data } = await supabase.rpc('get_user_streamers', { p_user_id: user.id });
        const hasDemoAccess = data?.some((streamer: any) => 
          streamer.streamer_slug === 'demo3' || streamer.is_admin === true
        );
        if (hasDemoAccess) {
          setHasAccess(true);
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        navigate('/dashboard');
      }
    };
    if (!loading) checkAccess();
  }, [user, loading, navigate]);

  if (loading || hasAccess === null) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!hasAccess) return null;

  return <StreamerDashboard streamerSlug="demo3" streamerName="Demo Streamer 3" brandColor="#10b981" tableName="demo3_donations" />;
};

export default Demo3Dashboard;
