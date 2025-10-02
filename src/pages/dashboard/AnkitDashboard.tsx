import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';
import { DualAudioPlayer } from '@/components/dashboard/DualAudioPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AnkitDashboard = () => {
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
        // Check if user has access to ankit dashboard or is admin
        const { data } = await supabase.rpc('get_user_streamers', {
          p_user_id: user.id
        });

        const hasAnkitAccess = data?.some((streamer: any) => 
          streamer.streamer_slug === 'ankit' || streamer.is_admin === true
        );

        if (hasAnkitAccess) {
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
    <div className="space-y-6">
      <StreamerDashboard
        streamerSlug="ankit"
        streamerName="Ankit"
        brandColor="#3b82f6"
        tableName="ankit_donations"
      />
      
      <div className="container mx-auto px-4 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Audio Management</CardTitle>
          </CardHeader>
          <CardContent>
            <DualAudioPlayer 
              tableName="ankit_donations"
              streamerId={hasAccess ? undefined : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnkitDashboard;