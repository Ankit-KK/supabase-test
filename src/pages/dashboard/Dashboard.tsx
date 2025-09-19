import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { user, loading, getUserStreamerAccess } = useAuth();
  const navigate = useNavigate();
  const [streamerAccess, setStreamerAccess] = useState<Array<{
    streamer_slug?: string;
    is_admin?: boolean;
  }>>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const access = await getUserStreamerAccess();
        setStreamerAccess(access);
        
        // Auto-redirect if user has only one streamer access and is not admin
        if (access.length === 1 && !access[0].is_admin) {
          const slug = access[0].streamer_slug;
          if (slug === 'ankit') {
            navigate('/dashboard/ankit');
          } else if (slug === 'chia_gaming') {
            navigate('/dashboard/chia-gaming');
          } else if (slug === 'demostreamer') {
            navigate('/dashboard/demostreamer');
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
  }, [user, loading, navigate, getUserStreamerAccess]);

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

  if (streamerAccess.length === 0) {
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
            <Button onClick={() => navigate('/')} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard - show all available streamers
  const isAdmin = streamerAccess.some(access => access.is_admin);
  if (isAdmin) {
    const availableStreamers = [
      { slug: 'ankit', name: 'Ankit', color: '#3b82f6' },
      { slug: 'chia_gaming', name: 'Chia Gaming', color: '#ec4899' },
      { slug: 'demostreamer', name: 'Demo Streamer', color: '#6366f1' }
    ];

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Badge variant="destructive">Administrator Access</Badge>
            <p className="text-muted-foreground">
              Welcome {user.email}. Select a streamer dashboard to manage:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableStreamers.map((streamer) => (
              <Card 
                key={streamer.slug} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/dashboard/${streamer.slug}`)}
              >
                <CardHeader>
                  <CardTitle 
                    className="text-center"
                    style={{ color: streamer.color }}
                  >
                    {streamer.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    className="w-full"
                    style={{ backgroundColor: streamer.color }}
                  >
                    Access Dashboard
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Admin Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => navigate('/admin/email-assignments')} variant="outline">
                Manage Email Assignments
              </Button>
              <p className="text-sm text-muted-foreground">
                Manage which emails can access specific streamer dashboards.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null; // Should have redirected to specific streamer dashboard
};

export default Dashboard;