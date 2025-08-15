import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Streamer {
  id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  user_id: string;
}

const StreamerSelection = () => {
  const { user, loading } = useAuth();
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchUserStreamers = async () => {
      try {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const userIsAdmin = profile?.username === 'admin';
        setIsAdmin(userIsAdmin);

        // Fetch streamers user has access to
        const { data, error } = await supabase
          .from('streamers')
          .select('*')
          .or(userIsAdmin ? undefined : `user_id.eq.${user.id}`);

        if (error) {
          console.error('Error fetching streamers:', error);
          return;
        }

        setStreamers(data || []);

        // If user has only one streamer, redirect directly
        if (data && data.length === 1) {
          navigate(`/${data[0].streamer_slug}/dashboard`);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchUserStreamers();
  }, [user, navigate]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Select Streamer Dashboard</h1>
          <p className="text-muted-foreground">Choose which streamer dashboard to access</p>
        </div>

        {isAdmin && (
          <div className="mb-6 text-center">
            <Button 
              onClick={() => navigate('/admin/streamers')} 
              variant="outline"
            >
              Manage Streamers
            </Button>
          </div>
        )}

        {streamers.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <h3 className="text-lg font-medium mb-2">No Access</h3>
              <p className="text-muted-foreground">
                You don't have access to any streamer dashboards. Please contact an administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streamers.map((streamer) => (
              <Card 
                key={streamer.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/${streamer.streamer_slug}/dashboard`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{streamer.streamer_name}</CardTitle>
                    {streamer.user_id === user.id && (
                      <Badge variant="secondary">Your Stream</Badge>
                    )}
                    {isAdmin && streamer.user_id !== user.id && (
                      <Badge variant="outline">Admin Access</Badge>
                    )}
                  </div>
                  <CardDescription>@{streamer.streamer_slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="w-full h-4 rounded-full mb-4"
                    style={{ backgroundColor: streamer.brand_color }}
                  />
                  <Button variant="outline" className="w-full">
                    Open Dashboard
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamerSelection;