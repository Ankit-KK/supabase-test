import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';

interface StreamerAssignment {
  id: string;
  email: string;
  streamer_slug: string;
  streamer_name: string;
}

const EmailAssignments = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<StreamerAssignment[]>([]);
  const [newAssignment, setNewAssignment] = useState({ email: '', streamer_slug: '' });
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const streamers = [
    { slug: 'ankit', name: 'Ankit' },
    { slug: 'chia_gaming', name: 'Chia Gaming' },
    { slug: 'demostreamer', name: 'Demo Streamer' }
  ];

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const { data } = await supabase.rpc('is_admin_email', {
          check_email: user.email
        });
        
        if (!data) {
          navigate('/dashboard');
          return;
        }
        
        setIsAdmin(true);
        loadAssignments();
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/dashboard');
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading) {
      checkAdminAccess();
    }
  }, [user, loading, navigate]);

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('streamers_auth_emails')
        .select(`
          id,
          email,
          streamers (
            streamer_slug,
            streamer_name
          )
        `);

      if (error) throw error;

      const formatted = data?.map(item => ({
        id: item.id,
        email: item.email,
        streamer_slug: item.streamers?.streamer_slug || '',
        streamer_name: item.streamers?.streamer_name || ''
      })) || [];

      setAssignments(formatted);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load email assignments');
    }
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.email || !newAssignment.streamer_slug) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase.rpc('assign_email_to_streamer', {
        p_streamer_slug: newAssignment.streamer_slug,
        p_email: newAssignment.email
      });

      if (error) throw error;

      toast.success('Email assigned successfully');
      setNewAssignment({ email: '', streamer_slug: '' });
      loadAssignments();
    } catch (error: any) {
      console.error('Error assigning email:', error);
      toast.error(error.message || 'Failed to assign email');
    }
  };

  const handleRemoveAssignment = async (email: string, streamerSlug: string) => {
    try {
      const { error } = await supabase.rpc('remove_email_from_streamer', {
        p_streamer_slug: streamerSlug,
        p_email: email
      });

      if (error) throw error;

      toast.success('Email assignment removed');
      loadAssignments();
    } catch (error: any) {
      console.error('Error removing assignment:', error);
      toast.error(error.message || 'Failed to remove assignment');
    }
  };

  const handleAddAdminEmail = async () => {
    if (!newAdminEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const { error } = await supabase.rpc('add_admin_email', {
        p_email: newAdminEmail
      });

      if (error) throw error;

      toast.success('Admin email added successfully');
      setNewAdminEmail('');
    } catch (error: any) {
      console.error('Error adding admin email:', error);
      toast.error(error.message || 'Failed to add admin email');
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Email Assignment Management</h1>
            <Badge variant="destructive">Admin Only</Badge>
          </div>
        </div>

        <Tabs defaultValue="streamer-assignments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="streamer-assignments">Streamer Assignments</TabsTrigger>
            <TabsTrigger value="admin-emails">Admin Emails</TabsTrigger>
          </TabsList>

          <TabsContent value="streamer-assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAssignment.email}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="streamer">Streamer</Label>
                    <select
                      id="streamer"
                      className="w-full px-3 py-2 border rounded-md"
                      value={newAssignment.streamer_slug}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, streamer_slug: e.target.value }))}
                    >
                      <option value="">Select Streamer</option>
                      {streamers.map(streamer => (
                        <option key={streamer.slug} value={streamer.slug}>
                          {streamer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddAssignment} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Assignment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Assignments ({assignments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No email assignments found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((assignment) => (
                      <div 
                        key={assignment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{assignment.email}</p>
                          <p className="text-sm text-muted-foreground">
                            → {assignment.streamer_name}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assignment.email, assignment.streamer_slug)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin-emails" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Admin Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                  <Button onClick={handleAddAdminEmail}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Admin
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Admin emails can access all streamer dashboards and manage assignments.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmailAssignments;