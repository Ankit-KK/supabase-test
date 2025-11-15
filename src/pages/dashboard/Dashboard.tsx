import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [userStreamers, setUserStreamers] = useState<Array<{
    id: string;
    streamer_slug: string;
    streamer_name: string;
    brand_color: string;
    is_owner: boolean;
    is_admin: boolean;
  }>>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_user_streamers', {
          p_user_id: user.id
        });
        
        if (error) throw error;
        
        const streamers = data || [];
        setUserStreamers(streamers);
        
        // Auto-redirect if user has only one streamer access and is not admin
        if (streamers.length === 1 && !streamers[0].is_admin) {
          const slug = streamers[0].streamer_slug;
          if (slug === 'ankit') {
            navigate('/dashboard/ankit');
          } else if (slug === 'chiaa_gaming') {
            navigate('/dashboard/chiaa_gaming');
          } else if (slug === 'demostreamer') {
            navigate('/dashboard/demostreamer');
          } else if (slug === 'damask_plays') {
            navigate('/dashboard/damask_plays');
          }
          return;
        }
      } catch (error) {
        console.error('Error checking streamer access:', error);
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  if (userStreamers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Access Assigned</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your email ({user.email}) hasn't been assigned to any streamer dashboard yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact an administrator to get access to a streamer dashboard.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/')} variant="outline">
                Return to Home
              </Button>
              <Button 
                onClick={async () => {
                  await signOut();
                  navigate('/auth');
                }} 
                variant="destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin or streamer owner dashboard - show accessible streamers
  const isAdmin = userStreamers.some(streamer => streamer.is_admin);
  
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">
            {isAdmin ? 'Admin Dashboard' : 'Streamer Dashboard'}
          </h1>
          {isAdmin && <Badge variant="destructive">Administrator Access</Badge>}
          <p className="text-muted-foreground">
            Welcome {user.email}. Select a streamer dashboard to manage:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userStreamers.map((streamer) => (
            <Card 
              key={streamer.streamer_slug} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/dashboard/${streamer.streamer_slug}`)}
            >
              <CardHeader>
                <CardTitle 
                  className="text-center"
                  style={{ color: streamer.brand_color }}
                >
                  {streamer.streamer_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  className="w-full"
                  style={{ backgroundColor: streamer.brand_color }}
                >
                  Access Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;