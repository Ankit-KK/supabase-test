import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Streamer {
  id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  user_id: string | null;
}

interface Profile {
  id: string;
  username: string | null;
}

const StreamerManagement = () => {
  const { user, loading } = useAuth();
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const userIsAdmin = profile?.username === 'admin';
        setIsAdmin(userIsAdmin);

        if (!userIsAdmin) {
          setLoadingData(false);
          return;
        }

        // Fetch all streamers
        const { data: streamersData, error: streamersError } = await supabase
          .from('streamers')
          .select('*')
          .order('streamer_name');

        if (streamersError) {
          console.error('Error fetching streamers:', streamersError);
          return;
        }

        // Fetch all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .order('username');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        setStreamers(streamersData || []);
        setProfiles(profilesData || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  const assignStreamerToUser = async (streamerId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from('streamers')
        .update({ user_id: userId })
        .eq('id', streamerId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to assign streamer to user",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setStreamers(prev => prev.map(s => 
        s.id === streamerId ? { ...s, user_id: userId } : s
      ));

      toast({
        title: "Success",
        description: "Streamer assignment updated",
      });
    } catch (error) {
      console.error('Error assigning streamer:', error);
      toast({
        title: "Error",
        description: "Failed to assign streamer to user",
        variant: "destructive",
      });
    }
  };

  const createNewStreamer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const streamerName = formData.get('streamerName') as string;
    const streamerSlug = formData.get('streamerSlug') as string;
    const brandColor = formData.get('brandColor') as string;

    try {
      const { error } = await supabase
        .from('streamers')
        .insert({
          streamer_name: streamerName,
          streamer_slug: streamerSlug,
          brand_color: brandColor,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create streamer",
          variant: "destructive",
        });
        return;
      }

      // Refresh streamers list
      const { data: streamersData } = await supabase
        .from('streamers')
        .select('*')
        .order('streamer_name');

      setStreamers(streamersData || []);

      toast({
        title: "Success",
        description: "Streamer created successfully",
      });

      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error creating streamer:', error);
      toast({
        title: "Error",
        description: "Failed to create streamer",
        variant: "destructive",
      });
    }
  };

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

  if (!isAdmin) {
    return <Navigate to="/streamers" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Streamer Management</h1>
            <p className="text-muted-foreground">Manage streamer accounts and assignments</p>
          </div>
          <Button onClick={() => window.history.back()} variant="outline">
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create New Streamer */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Streamer</CardTitle>
              <CardDescription>Add a new streamer to the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createNewStreamer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="streamerName">Streamer Name</Label>
                  <Input
                    id="streamerName"
                    name="streamerName"
                    placeholder="Gaming Streamer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streamerSlug">Streamer Slug</Label>
                  <Input
                    id="streamerSlug"
                    name="streamerSlug"
                    placeholder="gaming-streamer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandColor">Brand Color</Label>
                  <Input
                    id="brandColor"
                    name="brandColor"
                    type="color"
                    defaultValue="#6366f1"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Streamer
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Streamers */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Streamers</CardTitle>
              <CardDescription>Assign streamers to user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {streamers.map((streamer) => {
                  const assignedProfile = profiles.find(p => p.id === streamer.user_id);
                  
                  return (
                    <div key={streamer.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{streamer.streamer_name}</h4>
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: streamer.brand_color }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">@{streamer.streamer_slug}</p>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={streamer.user_id || 'unassigned'}
                          onValueChange={(value) => 
                            assignStreamerToUser(streamer.id, value === 'unassigned' ? null : value)
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.username || 'No username'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {assignedProfile ? (
                          <Badge variant="secondary">
                            {assignedProfile.username || 'No username'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StreamerManagement;
